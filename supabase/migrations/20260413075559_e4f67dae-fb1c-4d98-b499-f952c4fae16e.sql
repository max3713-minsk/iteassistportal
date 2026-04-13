
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'engineer', 'customer');
CREATE TYPE public.ticket_priority AS ENUM ('P1', 'P2', 'P3', 'P4');
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'waiting', 'resolved', 'closed');
CREATE TYPE public.maintenance_frequency AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'semi_annual', 'on_request');
CREATE TYPE public.protocol_status AS ENUM ('pending', 'in_progress', 'completed', 'overdue');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  organization TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Sites
CREATE TABLE public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  organization TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- Equipment categories
CREATE TABLE public.equipment_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT
);
ALTER TABLE public.equipment_categories ENABLE ROW LEVEL SECURITY;

-- Equipment
CREATE TABLE public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.equipment_categories(id),
  name TEXT NOT NULL,
  model TEXT,
  serial_number TEXT,
  os_info TEXT,
  quantity INT DEFAULT 1,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- Maintenance tasks
CREATE TABLE public.maintenance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.equipment_categories(id),
  title TEXT NOT NULL,
  description TEXT,
  frequency maintenance_frequency NOT NULL,
  is_automatable BOOLEAN DEFAULT false,
  automation_script TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;

-- Maintenance schedules
CREATE TABLE public.maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.maintenance_tasks(id) ON DELETE CASCADE,
  next_due_date DATE NOT NULL,
  last_completed_date DATE,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;

-- Maintenance protocols
CREATE TABLE public.maintenance_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id),
  frequency maintenance_frequency NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status protocol_status NOT NULL DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id),
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.maintenance_protocols ENABLE ROW LEVEL SECURITY;

-- Protocol items
CREATE TABLE public.protocol_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES public.maintenance_protocols(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.maintenance_schedules(id),
  equipment_id UUID NOT NULL REFERENCES public.equipment(id),
  task_id UUID NOT NULL REFERENCES public.maintenance_tasks(id),
  status TEXT DEFAULT 'pending',
  result TEXT,
  notes TEXT,
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  auto_result JSONB
);
ALTER TABLE public.protocol_items ENABLE ROW LEVEL SECURITY;

-- Tickets
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES public.sites(id),
  equipment_id UUID REFERENCES public.equipment(id),
  title TEXT NOT NULL,
  description TEXT,
  priority ticket_priority NOT NULL DEFAULT 'P3',
  status ticket_status NOT NULL DEFAULT 'open',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  sla_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Ticket comments
CREATE TABLE public.ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON public.sites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_protocols_updated_at BEFORE UPDATE ON public.maintenance_protocols FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Engineers can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'engineer'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Sites
CREATE POLICY "Authenticated can view sites" ON public.sites FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage sites" ON public.sites FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Engineers can manage sites" ON public.sites FOR ALL USING (public.has_role(auth.uid(), 'engineer'));

-- Equipment categories
CREATE POLICY "Authenticated can view categories" ON public.equipment_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage categories" ON public.equipment_categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Equipment
CREATE POLICY "Authenticated can view equipment" ON public.equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage equipment" ON public.equipment FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Engineers can manage equipment" ON public.equipment FOR ALL USING (public.has_role(auth.uid(), 'engineer'));

-- Maintenance tasks
CREATE POLICY "Authenticated can view tasks" ON public.maintenance_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage tasks" ON public.maintenance_tasks FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Engineers can manage tasks" ON public.maintenance_tasks FOR ALL USING (public.has_role(auth.uid(), 'engineer'));

-- Maintenance schedules
CREATE POLICY "Authenticated can view schedules" ON public.maintenance_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage schedules" ON public.maintenance_schedules FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Engineers can manage schedules" ON public.maintenance_schedules FOR ALL USING (public.has_role(auth.uid(), 'engineer'));

-- Protocols
CREATE POLICY "Authenticated can view protocols" ON public.maintenance_protocols FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage protocols" ON public.maintenance_protocols FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Engineers can manage protocols" ON public.maintenance_protocols FOR ALL USING (public.has_role(auth.uid(), 'engineer'));

-- Protocol items
CREATE POLICY "Authenticated can view protocol items" ON public.protocol_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage protocol items" ON public.protocol_items FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Engineers can manage protocol items" ON public.protocol_items FOR ALL USING (public.has_role(auth.uid(), 'engineer'));

-- Tickets
CREATE POLICY "Users can view own tickets" ON public.tickets FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Admins can view all tickets" ON public.tickets FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Engineers can view all tickets" ON public.tickets FOR SELECT USING (public.has_role(auth.uid(), 'engineer'));
CREATE POLICY "Authenticated can create tickets" ON public.tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins can manage tickets" ON public.tickets FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Engineers can update tickets" ON public.tickets FOR UPDATE USING (public.has_role(auth.uid(), 'engineer'));

-- Ticket comments
CREATE POLICY "Users can view non-internal comments on own tickets" ON public.ticket_comments FOR SELECT USING (
  NOT is_internal AND EXISTS (SELECT 1 FROM public.tickets WHERE tickets.id = ticket_comments.ticket_id AND tickets.created_by = auth.uid())
);
CREATE POLICY "Admins can view all comments" ON public.ticket_comments FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Engineers can view all comments" ON public.ticket_comments FOR SELECT USING (public.has_role(auth.uid(), 'engineer'));
CREATE POLICY "Authenticated can create comments" ON public.ticket_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage comments" ON public.ticket_comments FOR ALL USING (public.has_role(auth.uid(), 'admin'));
