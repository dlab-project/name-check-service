const SUPABASE_URL = 'https://avdxuubamsjuwwojqonb.supabase.co';
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZHh1dWJhbXNqdXd3b2pxb25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjI1MjcsImV4cCI6MjA3MDI5ODUyN30.KvZZyC44-0_scfXVv55S9DGskCFmBP378Ke_ZwUUi9w";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 관리자 비밀번호 (실제 운영 시에는 환경변수나 보안된 방식으로 관리해야 함)
const ADMIN_PASSWORD = 'admin1234';

// 인증 상태 변수
let isAuthenticated = false;

// 비밀번호 인증 함수
function authenticateUser(password) {
    return password === ADMIN_PASSWORD;
}

// 비밀번호 모달 표시/숨김 함수
function showPasswordModal() {
    const modal = document.getElementById('passwordModal');
    const input = document.getElementById('passwordInput');
    const error = document.getElementById('passwordError');
    
    if (modal) {
        modal.style.display = 'flex';
    }
    if (input) {
        input.value = '';
        input.focus();
    }
    if (error) {
        error.style.display = 'none';
    }
}

function hidePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 비밀번호 오류 메시지 표시
function showPasswordError(message) {
    const errorDiv = document.getElementById('passwordError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

// 인증 성공 시 처리
function onAuthenticationSuccess() {
    isAuthenticated = true;
    hidePasswordModal();
    
    // 메인 컨테이너 표시
    const mainContainer = document.querySelector('.admin-container');
    if (mainContainer) {
        mainContainer.style.display = 'block';
    }
    
    // 초기 데이터 로드
    loadCheckData();
    loadCurrentCode();
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    console.log('관리자 인증 성공');
}

// 인증 실패 시 처리
function onAuthenticationFailure() {
    showPasswordError('비밀번호가 올바르지 않습니다.');
    const input = document.getElementById('passwordInput');
    if (input) {
        input.value = '';
        input.focus();
    }
}

// 비밀번호 제출 처리
function handlePasswordSubmit() {
    const passwordInput = document.getElementById('passwordInput');
    const password = passwordInput.value.trim();
    
    if (!password) {
        showPasswordError('비밀번호를 입력해주세요.');
        return;
    }
    
    if (authenticateUser(password)) {
        onAuthenticationSuccess();
    } else {
        onAuthenticationFailure();
    }
}

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

// 현재 출석코드 로드 함수
async function loadCurrentCode() {
    try {
        const { data, error } = await supabase
            .from('code')
            .select('code, created_at')
            .order('created_at', { ascending: false })
            .limit(1);
            
        if (error) {
            console.error('출석코드 조회 오류:', error);
            document.getElementById('currentCode').textContent = '오류 발생';
            return;
        }
        
        if (!data || data.length === 0) {
            document.getElementById('currentCode').textContent = '등록된 코드 없음';
            return;
        }
        
        const currentCode = data[0];
        const codeElement = document.getElementById('currentCode');
        codeElement.textContent = currentCode.code;
        
        // 생성 시간 정보 업데이트
        const codeInfo = document.querySelector('.code-info');
        if (codeInfo) {
            const createdDate = new Date(currentCode.created_at);
            const timeString = createdDate.toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            codeInfo.textContent = `생성 시간: ${timeString}`;
        }
        
        console.log('현재 출석코드 로드 완료:', currentCode.code);
        
    } catch (error) {
        console.error('출석코드 로드 중 오류:', error);
        document.getElementById('currentCode').textContent = '오류 발생';
    }
}

// 코드 갱신하기 기능
async function updateCode() {
    const updateBtn = document.getElementById('updateCodeBtn');
    if (updateBtn) {
        updateBtn.disabled = true;
        updateBtn.textContent = '코드 갱신 중...';
    }
    
    try {
        // 4자리 랜덤 숫자 생성
        const newCode = Math.floor(1000 + Math.random() * 9000).toString();
        
        console.log('새로운 출석코드 생성:', newCode);
        
        // 데이터베이스에 새로운 코드 저장
        const { data, error } = await supabase
            .from('code')
            .insert([
                {
                    code: newCode,
                    created_at: new Date().toISOString()
                }
            ]);
            
        if (error) {
            console.error('새로운 코드 저장 오류:', error);
            throw new Error('새로운 코드 저장에 실패했습니다: ' + error.message);
        }
        
        console.log('새로운 출석코드 저장 완료:', data);
        
        // 성공 메시지 표시
        showCodeUpdateSuccess(newCode);
        
        // 현재 코드 정보 업데이트
        await loadCurrentCode();
        
    } catch (error) {
        console.error('코드 갱신 오류:', error);
        alert('코드 갱신 중 오류가 발생했습니다: ' + error.message);
    } finally {
        // 버튼 상태 복원
        if (updateBtn) {
            updateBtn.disabled = false;
            updateBtn.textContent = '코드 갱신하기';
        }
    }
}

// 코드 갱신 성공 메시지 표시
function showCodeUpdateSuccess(newCode) {
    const updateBtn = document.getElementById('updateCodeBtn');
    if (updateBtn) {
        const originalText = updateBtn.textContent;
        updateBtn.textContent = `갱신 완료: ${newCode}`;
        updateBtn.style.background = 'var(--color-success)';
        
        setTimeout(() => {
            updateBtn.textContent = '코드 갱신하기';
            updateBtn.style.background = '';
        }, 3000);
    }
    
    // 성공 알림
    alert(`출석코드가 성공적으로 갱신되었습니다!\n\n새 코드: ${newCode}`);
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 비밀번호 모달 표시
    showPasswordModal();
    
    // 비밀번호 제출 버튼 이벤트 리스너
    const passwordSubmitBtn = document.getElementById('passwordSubmit');
    if (passwordSubmitBtn) {
        passwordSubmitBtn.addEventListener('click', handlePasswordSubmit);
    }
    
    // 비밀번호 입력 필드 엔터키 이벤트
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
        passwordInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                handlePasswordSubmit();
            }
        });
    }
    
    // 비밀번호 모달 외부 클릭 시 숨김
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('passwordModal');
        if (modal && event.target == modal) {
            hidePasswordModal();
        }
    });
    
    console.log('관리자 페이지 초기화 완료');
});

// 인증 후 이벤트 리스너 설정 함수
function setupEventListeners() {
    // 데이터 내보내기 버튼 이벤트 리스너
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    // 출석코드 갱신 버튼 이벤트 리스너
    const updateCodeBtn = document.getElementById('updateCodeBtn');
    if (updateCodeBtn) {
        updateCodeBtn.addEventListener('click', updateCode);
    }
    
    console.log('이벤트 리스너 설정 완료');
}
