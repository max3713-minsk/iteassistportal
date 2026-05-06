
-- =========================================================
-- 1. Extend maintenance_tasks
-- =========================================================
ALTER TABLE public.maintenance_tasks
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS equipment_id uuid REFERENCES public.equipment(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_mtasks_site ON public.maintenance_tasks(site_id);
CREATE INDEX IF NOT EXISTS idx_mtasks_equipment ON public.maintenance_tasks(equipment_id);
CREATE INDEX IF NOT EXISTS idx_mtasks_freq ON public.maintenance_tasks(frequency);

-- =========================================================
-- 2. Protocol templates
-- =========================================================
CREATE TABLE IF NOT EXISTS public.protocol_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  frequency public.maintenance_frequency,
  site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  description text,
  default_executor_id uuid,
  default_responsible_id uuid,
  signatory_executor_label text DEFAULT 'Исполнитель',
  signatory_responsible_label text DEFAULT 'Ответственный',
  template_file_path text,
  template_file_name text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.protocol_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View templates" ON public.protocol_templates;
CREATE POLICY "View templates" ON public.protocol_templates
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins manage templates" ON public.protocol_templates;
CREATE POLICY "Admins manage templates" ON public.protocol_templates
  FOR ALL USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Engineers manage templates" ON public.protocol_templates;
CREATE POLICY "Engineers manage templates" ON public.protocol_templates
  FOR ALL USING (public.has_role(auth.uid(),'engineer'))
  WITH CHECK (public.has_role(auth.uid(),'engineer'));

-- =========================================================
-- 3. Extend maintenance_protocols
-- =========================================================
ALTER TABLE public.maintenance_protocols
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.protocol_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS executor_user_id uuid,
  ADD COLUMN IF NOT EXISTS executor_name text,
  ADD COLUMN IF NOT EXISTS responsible_user_id uuid,
  ADD COLUMN IF NOT EXISTS responsible_name text,
  ADD COLUMN IF NOT EXISTS signed_executor_at timestamptz,
  ADD COLUMN IF NOT EXISTS signed_responsible_at timestamptz;

-- =========================================================
-- 4. Factory reset two-admin approvals
-- =========================================================
CREATE TABLE IF NOT EXISTS public.factory_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by uuid NOT NULL,
  requested_by_email text,
  reason text,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected | executed | expired
  approved_by uuid,
  approved_by_email text,
  approved_at timestamptz,
  executed_at timestamptz,
  rejected_reason text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.factory_reset_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage reset requests" ON public.factory_reset_requests;
CREATE POLICY "Admins manage reset requests" ON public.factory_reset_requests
  FOR ALL USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- 5. Seed equipment categories (idempotent)
-- =========================================================
INSERT INTO public.equipment_categories (name, description, icon)
SELECT * FROM (VALUES
  ('ИБП', 'Источники бесперебойного питания', 'BatteryCharging'),
  ('Кондиционеры', 'Прецизионные кондиционеры и системы охлаждения', 'Wind'),
  ('Дизель-генераторные установки', 'ДГУ резервного электропитания', 'Fuel'),
  ('СХД', 'Системы хранения данных', 'HardDrive'),
  ('Серверы', 'Физические и кластерные серверы', 'Server'),
  ('Сетевое оборудование', 'Коммутаторы, маршрутизаторы', 'Network'),
  ('Межсетевые экраны', 'FW, IPS, шлюзы безопасности', 'ShieldCheck'),
  ('Виртуализация', 'Гипервизоры, кластеры виртуализации', 'Boxes'),
  ('Резервное копирование', 'Системы СРК и репликации', 'DatabaseBackup'),
  ('Мониторинг', 'Серверы и агенты мониторинга', 'Activity'),
  ('Системы пожаротушения', 'Газовое/порошковое пожаротушение', 'Flame'),
  ('СКС и щитовые', 'Структурированные кабельные системы и силовые щиты', 'CableIcon')
) AS v(name, description, icon)
WHERE NOT EXISTS (SELECT 1 FROM public.equipment_categories ec WHERE ec.name = v.name);

-- =========================================================
-- 6. Seed default maintenance tasks per category & frequency
-- =========================================================
DO $$
DECLARE
  cat record;
  task record;
BEGIN
  -- Universal across all categories
  FOR cat IN SELECT id, name FROM public.equipment_categories LOOP
    -- Daily
    INSERT INTO public.maintenance_tasks (title, description, frequency, category_id, is_system)
    SELECT 'Контроль состояния (' || cat.name || ')', 'Визуальный осмотр, проверка индикации и сигналов мониторинга', 'daily', cat.id, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.maintenance_tasks
      WHERE category_id = cat.id AND frequency='daily' AND title LIKE 'Контроль состояния%'
    );
    -- Weekly
    INSERT INTO public.maintenance_tasks (title, description, frequency, category_id, is_system)
    SELECT 'Анализ журналов событий (' || cat.name || ')', 'Просмотр event log за прошедшую неделю, фиксация аномалий', 'weekly', cat.id, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.maintenance_tasks
      WHERE category_id = cat.id AND frequency='weekly' AND title LIKE 'Анализ журналов%'
    );
    -- Monthly
    INSERT INTO public.maintenance_tasks (title, description, frequency, category_id, is_system)
    SELECT 'Проверка резервируемости (' || cat.name || ')', 'Тестирование переключения на резерв, проверка отказоустойчивости', 'monthly', cat.id, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.maintenance_tasks
      WHERE category_id = cat.id AND frequency='monthly' AND title LIKE 'Проверка резервируемости%'
    );
    -- Quarterly
    INSERT INTO public.maintenance_tasks (title, description, frequency, category_id, is_system)
    SELECT 'ТО оборудования (' || cat.name || ')', 'Регламентное техническое обслуживание, очистка, проверка крепления и контактов', 'quarterly', cat.id, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.maintenance_tasks
      WHERE category_id = cat.id AND frequency='quarterly' AND title LIKE 'ТО оборудования%'
    );
    -- Semi-annual
    INSERT INTO public.maintenance_tasks (title, description, frequency, category_id, is_system)
    SELECT 'Обновление ПО/прошивок (' || cat.name || ')', 'Проверка и установка обновлений, согласованных с заказчиком', 'semi_annual', cat.id, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.maintenance_tasks
      WHERE category_id = cat.id AND frequency='semi_annual' AND title LIKE 'Обновление ПО%'
    );
    -- On request
    INSERT INTO public.maintenance_tasks (title, description, frequency, category_id, is_system)
    SELECT 'Работы по запросу (' || cat.name || ')', 'Выполнение работ по обращению заказчика', 'on_request', cat.id, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.maintenance_tasks
      WHERE category_id = cat.id AND frequency='on_request' AND title LIKE 'Работы по запросу%'
    );
  END LOOP;

  -- Specific UPS daily
  INSERT INTO public.maintenance_tasks (title, description, frequency, category_id, is_system)
  SELECT 'Снятие показаний ИБП', 'Напряжение/ток батарей, температура, нагрузка', 'daily', ec.id, true
  FROM public.equipment_categories ec
  WHERE ec.name='ИБП' AND NOT EXISTS (
    SELECT 1 FROM public.maintenance_tasks WHERE title='Снятие показаний ИБП'
  );

  -- Specific climate
  INSERT INTO public.maintenance_tasks (title, description, frequency, category_id, is_system)
  SELECT 'Проверка фильтров и дренажа', 'Очистка фильтров, проверка дренажной системы кондиционеров', 'monthly', ec.id, true
  FROM public.equipment_categories ec
  WHERE ec.name='Кондиционеры' AND NOT EXISTS (
    SELECT 1 FROM public.maintenance_tasks WHERE title='Проверка фильтров и дренажа'
  );

  -- DGU monthly
  INSERT INTO public.maintenance_tasks (title, description, frequency, category_id, is_system)
  SELECT 'Тестовый пуск ДГУ', 'Запуск под нагрузкой, контроль параметров', 'monthly', ec.id, true
  FROM public.equipment_categories ec
  WHERE ec.name='Дизель-генераторные установки' AND NOT EXISTS (
    SELECT 1 FROM public.maintenance_tasks WHERE title='Тестовый пуск ДГУ'
  );
END $$;

-- =========================================================
-- 7. Trigger to update updated_at on protocol_templates / mtasks
-- =========================================================
DROP TRIGGER IF EXISTS trg_protocol_templates_updated ON public.protocol_templates;
CREATE TRIGGER trg_protocol_templates_updated BEFORE UPDATE ON public.protocol_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_factory_reset_updated ON public.factory_reset_requests;
CREATE TRIGGER trg_factory_reset_updated BEFORE UPDATE ON public.factory_reset_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_mtasks_updated ON public.maintenance_tasks;
CREATE TRIGGER trg_mtasks_updated BEFORE UPDATE ON public.maintenance_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
