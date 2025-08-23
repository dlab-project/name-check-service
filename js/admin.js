const SUPABASE_URL = 'https://avdxuubamsjuwwojqonb.supabase.co';
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZHh1dWJhbXNqdXd3b2pxb25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjI1MjcsImV4cCI6MjA3MDI5ODUyN30.KvZZyC44-0_scfXVv55S9DGskCFmBP378Ke_ZwUUi9w";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadCheckData() {
    const { data, error } = await supabase
        .from('check')
        .select('*')
        .order('checkin_time', { ascending: false });
    if (error) {
        alert('데이터 조회 실패: ' + error.message);
        return;
    }
    const tbody = document.querySelector('#checkTable tbody');
    tbody.innerHTML = '';
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.student_id}</td>
            <td>${row.checkin_time ? new Date(row.checkin_time).toISOString() : '-'}</td>
            <td>${row.checkout_time ? new Date(row.checkout_time).toISOString() : '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

document.addEventListener('DOMContentLoaded', loadCheckData);
