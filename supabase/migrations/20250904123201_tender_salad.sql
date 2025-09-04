/*
  # Schema inicial do FeedbackHub

  1. Novas Tabelas
    - `departments` - Departamentos da empresa
      - `id` (uuid, primary key)
      - `name` (text, nome do departamento)
      - `description` (text, descrição opcional)
      - `created_at` (timestamp)
    
    - `users` - Usuários do sistema (estende auth.users)
      - `id` (uuid, primary key, referencia auth.users)
      - `name` (text, nome completo)
      - `role` (text, papel: admin/manager/user)
      - `department_id` (uuid, referencia departments)
      - `is_active` (boolean, status ativo)
      - `created_at` (timestamp)
    
    - `feedback` - Feedbacks entre usuários
      - `id` (uuid, primary key)
      - `title` (text, título do feedback)
      - `description` (text, conteúdo)
      - `type` (text, tipo: performance/360/development/recognition)
      - `priority` (text, prioridade: low/medium/high/urgent)
      - `status` (text, status: draft/submitted/in_review/completed/archived)
      - `rating` (integer, avaliação 1-5)
      - `from_user_id` (uuid, quem deu o feedback)
      - `to_user_id` (uuid, quem recebeu)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas para controle de acesso baseado em roles
    - Usuários só veem dados permitidos pelo seu papel
*/

-- Criar tabela de departamentos
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de usuários (estende auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  department_id uuid REFERENCES departments(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de feedback
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL DEFAULT 'performance' CHECK (type IN ('performance', '360', 'development', 'recognition')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'completed', 'archived')),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  from_user_id uuid NOT NULL REFERENCES users(id),
  to_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Políticas para departments
CREATE POLICY "Todos podem ver departamentos"
  ON departments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Apenas admins podem criar departamentos"
  ON departments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para users
CREATE POLICY "Usuários podem ver outros usuários"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins podem gerenciar usuários"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para feedback
CREATE POLICY "Usuários podem ver feedback relacionado a eles"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (
    from_user_id = auth.uid() OR 
    to_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Usuários podem criar feedback"
  ON feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar próprio feedback"
  ON feedback
  FOR UPDATE
  TO authenticated
  USING (
    from_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para feedback
CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para criar usuário após registro
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'), 'user');
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger para criar usuário automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();