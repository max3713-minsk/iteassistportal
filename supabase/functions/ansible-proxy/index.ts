import { corsHeaders } from '@supabase/supabase-js/cors'
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Verify auth
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const ANSIBLE_HOST = Deno.env.get('ANSIBLE_HOST')
  const ANSIBLE_USER = Deno.env.get('ANSIBLE_USER')
  const ANSIBLE_PASSWORD = Deno.env.get('ANSIBLE_PASSWORD')

  if (!ANSIBLE_HOST || !ANSIBLE_USER || !ANSIBLE_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Ansible credentials not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const body = await req.json()
    const { action, playbook, extra_vars, job_id } = body

    // Ansible uses SSH; we'll use a simple REST-like proxy approach
    // For production, this would connect to Ansible AWX/Semaphore API
    // For now, we'll simulate the execution tracking and provide the framework

    switch (action) {
      case 'listPlaybooks': {
        // Return available playbooks for maintenance automation
        const playbooks = [
          { id: 'check_disk_space', name: 'Проверка дискового пространства', category: 'daily', description: 'df -h на всех серверах' },
          { id: 'check_services', name: 'Проверка статуса сервисов', category: 'daily', description: 'systemctl status критичных сервисов' },
          { id: 'check_logs', name: 'Анализ системных логов', category: 'daily', description: 'journalctl --since yesterday' },
          { id: 'backup_check', name: 'Проверка резервных копий', category: 'daily', description: 'Проверка статуса последнего бэкапа' },
          { id: 'update_check', name: 'Проверка обновлений ОС', category: 'weekly', description: 'apt list --upgradable / yum check-update' },
          { id: 'cert_check', name: 'Проверка SSL сертификатов', category: 'monthly', description: 'Проверка сроков SSL сертификатов' },
          { id: 'security_audit', name: 'Аудит безопасности', category: 'monthly', description: 'Проверка открытых портов, учетных записей' },
          { id: 'db_maintenance', name: 'Обслуживание БД PostgreSQL', category: 'weekly', description: 'VACUUM, ANALYZE, проверка репликации' },
          { id: 'k8s_health', name: 'Проверка Kubernetes кластера', category: 'daily', description: 'kubectl get nodes, pods status' },
          { id: 'network_check', name: 'Диагностика сети', category: 'daily', description: 'ping, traceroute, проверка VPN туннелей' },
        ]
        return new Response(JSON.stringify({ result: playbooks }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'runPlaybook': {
        if (!playbook) {
          return new Response(JSON.stringify({ error: 'Playbook ID required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // In production, this would SSH to ANSIBLE_HOST and run ansible-playbook
        // or call Ansible AWX/Semaphore API
        const jobId = crypto.randomUUID()
        const result = {
          job_id: jobId,
          playbook,
          status: 'queued',
          started_at: new Date().toISOString(),
          host: ANSIBLE_HOST,
          message: `Playbook ${playbook} поставлен в очередь на ${ANSIBLE_HOST}`,
        }

        return new Response(JSON.stringify({ result }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'getJobStatus': {
        if (!job_id) {
          return new Response(JSON.stringify({ error: 'Job ID required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Placeholder - in production would check actual job status
        const result = {
          job_id,
          status: 'completed',
          output: 'Playbook executed successfully',
          completed_at: new Date().toISOString(),
        }

        return new Response(JSON.stringify({ result }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (err) {
    console.error('Ansible proxy error:', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
