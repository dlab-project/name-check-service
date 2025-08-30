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

// 시간 포맷팅 함수 (기본 형태)
function formatTime(isoTimeString) {
    if (!isoTimeString) return '-';
    const date = new Date(isoTimeString);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}. ${month}. ${day}. ${hour}:${minute}:${second}`;
}

// 상태 표시 함수
function getStatusText(checkinTime, checkoutTime) {
    if (!checkinTime) return '<span class="status-absent">미출석</span>';
    if (!checkoutTime) return '<span class="status-present">출석</span>';
    return '<span class="status-checked-out">퇴실</span>';
}

async function loadCheckData() {
    try {
        console.log('데이터 로드 시작:', new Date().toISOString());
        
        // 캐시 방지를 위한 쿼리 (실시간 데이터 가져오기)
        const { data, error } = await supabase
            .from('check')
            .select('*')
            .order('checkin_time', { ascending: false })
            .limit(1000); // 최대 1000건으로 제한하여 성능 최적화
            
        if (error) {
            console.error('데이터 조회 오류:', error);
            alert('데이터 조회 실패: ' + error.message);
            return;
        }
        
        console.log('DB에서 가져온 데이터:', {
            총건수: data ? data.length : 0,
            첫번째데이터: data && data.length > 0 ? data[0] : null,
            조회시간: new Date().toISOString()
        });
        
        const tbody = document.querySelector('#checkTable tbody');
        if (!tbody) {
            console.error('테이블 tbody 요소를 찾을 수 없습니다.');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #666;">출석 데이터가 없습니다.</td></tr>';
            console.log('출석 데이터가 없습니다.');
            return;
        }
        
        data.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${row.student_id}</strong></td>
                <td>${formatTime(row.checkin_time)}</td>
                <td>${formatTime(row.checkout_time)}</td>
                <td>${getStatusText(row.checkin_time, row.checkout_time)}</td>
            `;
            tbody.appendChild(tr);
            
            // 처음 5개 데이터만 로그 출력
            if (index < 5) {
                console.log(`행 ${index + 1}:`, {
                    학번: row.student_id,
                    출석시간: row.checkin_time,
                    퇴실시간: row.checkout_time
                });
            }
        });
        
        console.log('테이블 업데이트 완료:', data.length + '건');
        
        // 마지막 업데이트 시간 표시 (선택사항)
        const lastUpdate = new Date().toISOString();
        console.log('마지막 업데이트:', lastUpdate);
        
    } catch (error) {
        console.error('데이터 로드 중 오류:', error);
        alert('데이터 로드 중 오류가 발생했습니다: ' + error.message);
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
            const year = createdDate.getFullYear();
            const month = String(createdDate.getMonth() + 1).padStart(2, '0');
            const day = String(createdDate.getDate()).padStart(2, '0');
            const hour = String(createdDate.getHours()).padStart(2, '0');
            const minute = String(createdDate.getMinutes()).padStart(2, '0');
            const timeString = `${year}. ${month}. ${day}. ${hour}:${minute}`;
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

// 새로고침 기능
async function refreshData() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.style.transform = 'rotate(180deg)';
    }
    
    try {
        console.log('=== 수동 새로고침 시작 ===');
        console.log('새로고침 시간:', new Date().toISOString());
        
        // Supabase 연결 상태 확인
        console.log('Supabase 클라이언트 상태:', {
            url: supabase.supabaseUrl,
            key: supabase.supabaseKey ? '설정됨' : '설정안됨'
        });
        
        // 강제로 데이터 다시 로드
        await loadCheckData();
        
        // 출석코드도 함께 새로고침
        await loadCurrentCode();
        
        console.log('=== 새로고침 완료 ===');
        
        // 성공 애니메이션
        if (refreshBtn) {
            refreshBtn.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                refreshBtn.style.transform = '';
            }, 300);
        }
        
        // 성공 메시지를 콘솔과 일시적으로 버튼에 표시
        if (refreshBtn) {
            const originalTitle = refreshBtn.title;
            refreshBtn.title = '새로고침 완료!';
            setTimeout(() => {
                refreshBtn.title = originalTitle;
            }, 2000);
        }
        
    } catch (error) {
        console.error('데이터 새로고침 오류:', error);
        alert('데이터 새로고침 중 오류가 발생했습니다: ' + error.message);
    } finally {
        if (refreshBtn) {
            refreshBtn.disabled = false;
        }
    }
}

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
    
    // 새로고침 버튼 이벤트 리스너
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshData);
    }
    
    console.log('이벤트 리스너 설정 완료');
}
