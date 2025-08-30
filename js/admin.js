const SUPABASE_URL = 'https://avdxuubamsjuwwojqonb.supabase.co';
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZHh1dWJhbXNqdXd3b2pxb25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjI1MjcsImV4cCI6MjA3MDI5ODUyN30.KvZZyC44-0_scfXVv55S9DGskCFmBP378Ke_ZwUUi9w";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 시간 포맷팅 함수
function formatTime(isoTimeString) {
    if (!isoTimeString) return '-';
    const date = new Date(isoTimeString);
    return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// 상태 표시 함수
function getStatusText(checkinTime, checkoutTime) {
    if (!checkinTime) return '<span class="status-absent">미출석</span>';
    if (!checkoutTime) return '<span class="status-present">출석</span>';
    return '<span class="status-checked-out">퇴실</span>';
}

async function loadCheckData() {
    try {
        const { data, error } = await supabase
            .from('check')
            .select('*')
            .order('checkin_time', { ascending: false });
            
        if (error) {
            console.error('데이터 조회 오류:', error);
            alert('데이터 조회 실패: ' + error.message);
            return;
        }
        
        const tbody = document.querySelector('#checkTable tbody');
        tbody.innerHTML = '';
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #666;">출석 데이터가 없습니다.</td></tr>';
            return;
        }
        
        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${row.student_id}</strong></td>
                <td>${formatTime(row.checkin_time)}</td>
                <td>${formatTime(row.checkout_time)}</td>
                <td>${getStatusText(row.checkin_time, row.checkout_time)}</td>
            `;
            tbody.appendChild(tr);
        });
        
        console.log('데이터 로드 완료:', data.length + '건');
    } catch (error) {
        console.error('데이터 로드 중 오류:', error);
        alert('데이터 로드 중 오류가 발생했습니다.');
    }
}

// 새로고침 버튼 기능
async function refreshData() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.textContent = '새로고침 중...';
    }
    
    try {
        await loadCheckData();
        if (refreshBtn) {
            refreshBtn.textContent = '새로고침 완료';
            setTimeout(() => {
                refreshBtn.textContent = '새로고침';
                refreshBtn.disabled = false;
            }, 1000);
        }
    } catch (error) {
        if (refreshBtn) {
            refreshBtn.textContent = '새로고침';
            refreshBtn.disabled = false;
        }
    }
}

// 데이터 내보내기 기능 (Excel 형식)
function exportData() {
    try {
        const table = document.getElementById('checkTable');
        const rows = Array.from(table.querySelectorAll('tr'));
        
        // 데이터 배열 생성 (헤더 제외)
        const data = [];
        
        // 헤더 행 추가
        data.push(['학번', '출석 시간', '퇴실 시간', '상태']);
        
        // 데이터 행 추가 (헤더 제외)
        for (let i = 1; i < rows.length; i++) {
            const cells = rows[i].querySelectorAll('td');
            if (cells.length >= 4) {
                const studentId = cells[0].textContent.trim();
                const checkinTime = cells[1].textContent.trim();
                const checkoutTime = cells[2].textContent.trim();
                const status = cells[3].textContent.trim();
                
                data.push([studentId, checkinTime, checkoutTime, status]);
            }
        }
        
        // 워크북 생성
        const wb = XLSX.utils.book_new();
        
        // 워크시트 생성
        const ws = XLSX.utils.aoa_to_sheet(data);
        
        // 열 너비 자동 조정
        const colWidths = [
            { wch: 15 },  // 학번
            { wch: 25 },  // 출석 시간
            { wch: 25 },  // 퇴실 시간
            { wch: 12 }   // 상태
        ];
        ws['!cols'] = colWidths;
        
        // 워크시트를 워크북에 추가
        XLSX.utils.book_append_sheet(wb, ws, '출석현황');
        
        // 파일명 생성 (현재 날짜 포함)
        const fileName = `제일고등학교_야간자율학습_출석현황_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        // Excel 파일 다운로드
        XLSX.writeFile(wb, fileName);
        
        console.log('Excel 파일 내보내기 완료:', fileName);
        
        // 성공 메시지 표시
        showExportSuccess();
        
    } catch (error) {
        console.error('Excel 파일 내보내기 오류:', error);
        alert('Excel 파일 내보내기 중 오류가 발생했습니다: ' + error.message);
    }
}

// 내보내기 성공 메시지 표시
function showExportSuccess() {
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        const originalText = exportBtn.textContent;
        exportBtn.textContent = '내보내기 완료!';
        exportBtn.style.background = 'var(--color-success)';
        
        setTimeout(() => {
            exportBtn.textContent = originalText;
            exportBtn.style.background = '';
        }, 2000);
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 초기 데이터 로드
    loadCheckData();
    
    // 새로고침 버튼 이벤트 리스너
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshData);
    }
    
    // 데이터 내보내기 버튼 이벤트 리스너
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    console.log('관리자 페이지 초기화 완료');
});
