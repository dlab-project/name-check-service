const SUPABASE_URL = 'https://avdxuubamsjuwwojqonb.supabase.co'
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZHh1dWJhbXNqdXd3b2pxb25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjI1MjcsImV4cCI6MjA3MDI5ODUyN30.KvZZyC44-0_scfXVv55S9DGskCFmBP378Ke_ZwUUi9w"
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 학번 저장 변수
let studentId = '';



// 로컬 스토리지 관련 함수들
function saveStudentIdToStorage(id) {
    localStorage.setItem('studentId', id);
}

function getStudentIdFromStorage() {
    return localStorage.getItem('studentId');
}

function removeStudentIdFromStorage() {
    localStorage.removeItem('studentId');
}

// 학번 표시 업데이트 함수
function updateStudentIdDisplay() {
    const studentIdDisplay = document.getElementById('studentIdDisplay');
    const currentStudentIdSpan = document.getElementById('currentStudentId');
    const editStudentIdBtn = document.getElementById('editStudentIdBtn');
    
    if (studentId && studentIdDisplay && currentStudentIdSpan) {
        currentStudentIdSpan.textContent = studentId;
        studentIdDisplay.style.display = 'block';
        // 학번이 있을 때만 수정 버튼 표시
        if (editStudentIdBtn) {
            editStudentIdBtn.style.display = 'inline-block';
        }
    } else if (studentIdDisplay) {
        studentIdDisplay.style.display = 'none';
        // 학번이 없을 때는 수정 버튼 숨김
        if (editStudentIdBtn) {
            editStudentIdBtn.style.display = 'none';
        }
    }
}

// 학번 변경 시 기존 출석 기록 초기화 함수
function clearAttendanceDisplay() {
    const timeDisplay = document.getElementById('timeDisplay');
    if (timeDisplay) {
        timeDisplay.innerHTML = '';
    }
    
    // 출석 관련 버튼들도 초기 상태로 리셋
    const checkinBtn = document.getElementById('checkinBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (checkinBtn) {
        checkinBtn.style.display = 'none';
    }
    if (checkoutBtn) {
        checkoutBtn.style.display = 'none';
    }
}

// 출석 상태에 따른 버튼 표시/숨김 처리
async function updateButtonVisibility() {
    const checkinBtn = document.getElementById('checkinBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const timeDisplay = document.getElementById('timeDisplay');
    
    if (!studentId) {
        // 학번이 없으면 모든 버튼 숨김
        checkinBtn.style.display = 'none';
        checkoutBtn.style.display = 'none';
        
        // 학번 입력 안내 메시지 표시
        if (timeDisplay) {
            timeDisplay.innerHTML = `
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="font-size: 24px; color: #333; margin-bottom: 20px;">
                        <strong>🎓 학생 출석 관리 시스템</strong>
                    </div>
                    <div style="font-size: 16px; color: #666; margin-bottom: 30px;">
                        출석체크를 위해 학번을 입력해주세요
                    </div>
                    <button onclick="showStudentIdModal()" style="
                        background-color: #007bff; 
                        color: white; 
                        border: none; 
                        padding: 12px 24px; 
                        border-radius: 6px; 
                        font-size: 16px; 
                        cursor: pointer;
                        transition: background-color 0.3s;
                    " onmouseover="this.style.backgroundColor='#0056b3'" 
                       onmouseout="this.style.backgroundColor='#007bff'">
                        학번 입력하기
                    </button>
                </div>
            `;
        }
        return;
    }

    try {
        // 한국 시간으로 변환 (UTC+9)
        const currentTime = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
        const today = currentTime.toISOString().split('T')[0];
        
        // 새로운 학번으로 오늘의 출석 기록 확인
        const { data: todayCheck, error: checkError } = await supabase
            .from('check')
            .select('*')
            .eq('student_id', studentId)
            .gte('checkin_time', today + 'T00:00:00.000Z')
            .lt('checkin_time', today + 'T23:59:59.999Z');
            
        if (checkError) {
            console.error('출석 상태 확인 오류:', checkError);
            return;
        }

        // 학번이 변경되었을 때 이전 출석 기록 표시 방지
        if (timeDisplay && (!todayCheck || todayCheck.length === 0)) {
            // 새로운 학번에 대한 출석 기록이 없으면 기존 표시 내용 초기화
            timeDisplay.innerHTML = '';
        }

        if (!todayCheck || todayCheck.length === 0) {
            // 오늘 출석하지 않음 - 출석 체크 버튼만 표시
            checkinBtn.style.display = 'inline-block';
            checkoutBtn.style.display = 'none';
        } else {
            // 오늘 출석함 - 퇴실 체크 여부에 따라 결정
            const todayRecord = todayCheck[0];
            if (todayRecord.checkout_time === null) {
                // 출석했지만 퇴실하지 않음 - 퇴실 체크 버튼만 표시
                checkinBtn.style.display = 'none';
                checkoutBtn.style.display = 'inline-block';
            } else {
                // 출석하고 퇴실도 함 - 모든 버튼 숨김
                checkinBtn.style.display = 'none';
                checkoutBtn.style.display = 'none';
                timeDisplay.innerHTML = `
                    <div style="color: blue;"><strong>✅ 오늘의 출석과 퇴실이 모두 완료되었습니다.</strong></div>
                    <div style="margin-bottom: 10px;"><strong>학번:</strong> ${studentId}</div>
                    <div style="margin-bottom: 10px;"><strong>출석 시간:</strong> ${new Date(todayRecord.checkin_time).toLocaleString('ko-KR')}</div>
                    <div><strong>퇴실 시간:</strong> ${new Date(todayRecord.checkout_time).toLocaleString('ko-KR')}</div>
                `;
            }
        }
    } catch (error) {
        console.error('버튼 표시 상태 업데이트 오류:', error);
    }
}

// 페이지 로드 시 로컬 스토리지에서 학번 불러오기
document.addEventListener('DOMContentLoaded', function() {
    const savedStudentId = getStudentIdFromStorage();
    if (savedStudentId) {
        studentId = savedStudentId;
        updateStudentIdDisplay();
        updateButtonVisibility(); // 출석 상태에 따른 버튼 표시 업데이트
    } else {
        // 학번이 없으면 기본 메인페이지 표시하고 학번 입력 모달 자동 표시
        updateStudentIdDisplay();
        updateButtonVisibility();
        // 약간의 지연 후 학번 입력 모달 표시
        setTimeout(() => {
            showStudentIdModal();
        }, 500);
    }
    
    // 학번 수정 버튼 이벤트 리스너 추가
    const editStudentIdBtn = document.getElementById('editStudentIdBtn');
    if (editStudentIdBtn) {
        editStudentIdBtn.addEventListener('click', function() {
            showStudentIdModal();
        });
    }
});

// 학번 입력 모달 관련 코드
function showStudentIdModal() {
    document.getElementById('studentIdModal').style.display = 'flex';
    document.getElementById('studentIdInput').value = '';
    document.getElementById('studentIdError').style.display = 'none';
    
    // 기존 학번이 있으면 표시
    if (studentId) {
        document.getElementById('studentIdInput').value = studentId;
        document.getElementById('studentIdInput').select();
        // 기존 학번이 있으면 "학번 수정"으로 제목 변경
        document.querySelector('#studentIdModal h2').textContent = '학번 수정';
    } else {
        // 기존 학번이 없으면 "학번 입력"으로 제목 변경
        document.querySelector('#studentIdModal h2').textContent = '학번 입력';
    }
}

function hideStudentIdModal() {
    document.getElementById('studentIdModal').style.display = 'none';
}

// 페이지 로드시에는 학번 입력 모달을 띄우지 않음

document.getElementById('studentIdSubmit').addEventListener('click', function() {
    const input = document.getElementById('studentIdInput').value;
    if (!input || input.trim() === '') {
        document.getElementById('studentIdError').textContent = '올바른 학번을 입력해주세요.';
        document.getElementById('studentIdError').style.display = 'block';
        return;
    }
    
    const newStudentId = input.trim();
    
    // 기존 학번이 있고, 새로운 학번과 다른 경우 확인 절차
    if (studentId && studentId !== newStudentId) {
        if (!confirm(`현재 학번 '${studentId}'에서 '${newStudentId}'로 변경하시겠습니까?\n\n⚠️ 주의: 학번 변경 시 기존 출석 기록과의 연결이 끊어질 수 있습니다.`)) {
            return;
        }
        // 학번 변경 시 기존 출석 기록 초기화
        clearAttendanceDisplay();
    }
    
    studentId = newStudentId;
    // 로컬 스토리지에 저장
    saveStudentIdToStorage(studentId);
    hideStudentIdModal();
    updateStudentIdDisplay();
    
    // 학번 변경 후 새로운 학번에 대한 출석 상태 확인
    setTimeout(() => {
        updateButtonVisibility(); // 학번 입력 후 버튼 표시 상태 업데이트
    }, 100);
});

// 취소 버튼 이벤트 리스너
document.getElementById('studentIdCancel').addEventListener('click', function() {
    // 학번이 없으면 모달을 닫지 않음 (사용자가 반드시 학번을 입력해야 함)
    if (!studentId) {
        alert('출석체크를 위해 학번을 입력해주세요.');
        return;
    }
    hideStudentIdModal();
});

document.getElementById('studentIdInput').addEventListener('keydown', function(e) {
    // 숫자(0~9), 백스페이스, 탭, 방향키, 엔터만 허용
    if (
        !(
            (e.key >= '0' && e.key <= '9') ||
            e.key === 'Backspace' ||
            e.key === 'Tab' ||
            e.key === 'ArrowLeft' ||
            e.key === 'ArrowRight' ||
            e.key === 'Delete' ||
            e.key === 'Enter'
        )
    ) {
        e.preventDefault();
    }
    if (e.key === 'Enter') {
        document.getElementById('studentIdSubmit').click();
    }
// 입력값이 숫자가 아닌 경우 자동으로 제거
document.getElementById('studentIdInput').addEventListener('input', function(e) {
    this.value = this.value.replace(/[^0-9]/g, '');
});
});

// 출석체크 버튼과 시간 표시 기능
const checkinBtn = document.getElementById('checkinBtn');
const timeDisplay = document.getElementById('timeDisplay');

checkinBtn.addEventListener('click', async function() {
    if (!studentId || studentId.trim() === '') {
        showStudentIdModal();
        return;
    }
    
    // 버튼 비활성화
    checkinBtn.disabled = true;
    checkinBtn.textContent = '출석체크 중...';
    
    try {
        // 한국 시간으로 변환 (UTC+9)
        const currentTime = new Date();
        
        // 오늘 날짜만 추출 (YYYY-MM-DD 형식)
        const today = currentTime.toISOString().split('T')[0];
        
        // 중복 출석 체크 - 날짜만으로 판별
        const { data: existingCheck, error: checkError } = await supabase
            .from('check')
            .select('*')
            .eq('student_id', studentId)
            .gte('checkin_time', today + 'T00:00:00.000Z')
            .lt('checkin_time', today + 'T23:59:59.999Z');
            
        if (checkError) {
            console.error('중복 체크 오류:', checkError);
            throw checkError;
        }
        
        // 중복 체크 결과 로그 출력 (디버깅용)
        console.log('중복 체크 결과:', existingCheck);
        console.log('검색 범위:', {
            date: today,
            studentId: studentId
        });
        
        if (existingCheck && existingCheck.length > 0) {
            const existingRecord = existingCheck[0];
            const checkinTime = new Date(existingRecord.checkin_time).toLocaleString('ko-KR');
            timeDisplay.innerHTML = `
                <div style="color: orange;"><strong>⚠️ 이미 오늘 출석한 기록이 있습니다.</strong></div>
                <div style="margin-bottom: 10px;"><strong>학번:</strong> ${studentId}</div>
                <div><strong>출석 시간:</strong> ${checkinTime}</div>
            `;
            alert('이미 오늘 출석한 기록이 있습니다.');
            updateButtonVisibility(); // 버튼 표시 상태 업데이트
            return;
        }
        // 시간 문자열 직접 생성
        const year = currentTime.getUTCFullYear();
        const month = String(currentTime.getUTCMonth() + 1).padStart(2, '0');
        const day = String(currentTime.getUTCDate()).padStart(2, '0');
        const hour = String(currentTime.getUTCHours()).padStart(2, '0');
        const minute = String(currentTime.getUTCMinutes()).padStart(2, '0');
        const second = String(currentTime.getUTCSeconds()).padStart(2, '0');
        const currentTimeString = `${year}. ${month}. ${day}. ${hour}:${minute}:${second}`;
        // Supabase에 출석 데이터 저장
        const { data, error } = await supabase
            .from('check')
            .insert([
                {
                    student_id: studentId,
                    checkin_time: currentTime.toISOString()
                }
            ]);
        if (error) {
            throw error;
        }
        timeDisplay.innerHTML = `
            <div style="margin-bottom: 10px; color: green;"><strong>✅ 출석체크가 완료되었습니다!</strong></div>
            <div style="margin-bottom: 10px;"><strong>학번:</strong> ${studentId}</div>
            <div><strong>출석 시간:</strong> ${currentTimeString}</div>
        `;
        alert('출석체크가 완료되었습니다!');
        console.log('출석 기록 저장 성공:', data);
        
        // 출석 완료 후 버튼 표시 상태 업데이트
        updateButtonVisibility();
        
    } catch (error) {
        console.error('출석체크 오류:', error);
        timeDisplay.innerHTML = `
            <div style="color: red;"><strong>❌ 출석체크 실패: ${error.message}</strong></div>
        `;
        alert('출석체크에 실패했습니다: ' + error.message);
    } finally {
        // 버튼 다시 활성화
        checkinBtn.disabled = false;
        checkinBtn.textContent = '출석체크';
    }
});

// 퇴실체크 버튼 기능
const checkoutBtn = document.getElementById('checkoutBtn');

checkoutBtn.addEventListener('click', function() {
    if (!studentId || studentId.trim() === '') {
        alert('먼저 학번을 입력해주세요.');
        showStudentIdModal();
        return;
    }
    // 스토리지에 있는 학번으로 퇴실체크 처리
    handleCheckout();
});

async function handleCheckout() {
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = '퇴실체크 중...';
    try {
        // 한국 시간으로 변환 (UTC+9)
        const currentTime = new Date();
        // 시간 문자열 직접 생성
        const year = currentTime.getUTCFullYear();
        const month = String(currentTime.getUTCMonth() + 1).padStart(2, '0');
        const day = String(currentTime.getUTCDate()).padStart(2, '0');
        const hour = String(currentTime.getUTCHours()).padStart(2, '0');
        const minute = String(currentTime.getUTCMinutes()).padStart(2, '0');
        const second = String(currentTime.getUTCSeconds()).padStart(2, '0');
        const currentTimeString = `${year}. ${month}. ${day}. ${hour}:${minute}:${second}`;

        // 오늘 날짜만 추출 (YYYY-MM-DD 형식)
        const today = currentTime.toISOString().split('T')[0];
        
        // 오늘의 출석 기록 확인 - 날짜만으로 판별
        const { data: todayCheck, error: checkError } = await supabase
            .from('check')
            .select('*')
            .eq('student_id', studentId)
            .gte('checkin_time', today + 'T00:00:00.000Z')
            .lt('checkin_time', today + 'T23:59:59.999Z');
        if (checkError) throw checkError;
        if (!todayCheck || todayCheck.length === 0) {
            throw new Error('오늘의 출석 기록이 없습니다.');
        }
        // 이미 퇴실 체크가 되어있는지 확인
        if (todayCheck[0].checkout_time !== null) {
            throw new Error('이미 퇴실 처리가 완료되었습니다.');
        }
        // 퇴실 시간 업데이트
        const { data, error } = await supabase
            .from('check')
            .update({ checkout_time: currentTime.toISOString() })
            .eq('student_id', studentId)
            .gte('checkin_time', today + 'T00:00:00.000Z')
            .lt('checkin_time', today + 'T23:59:59.999Z');
        if (error) throw error;
        timeDisplay.innerHTML = `
            <div style="margin-bottom: 10px; color: green;"><strong>✅ 퇴실체크가 완료되었습니다!</strong></div>
            <div style="margin-bottom: 10px;"><strong>학번:</strong> ${studentId}</div>
            <div><strong>퇴실 시간:</strong> ${currentTimeString}</div>
        `;
        alert('퇴실체크가 완료되었습니다!');
        console.log('퇴실 시간 저장 성공:', data);
        
        // 퇴실 완료 후 버튼 표시 상태 업데이트
        updateButtonVisibility();
        
    } catch (error) {
        console.error('퇴실체크 오류:', error);
        timeDisplay.innerHTML = `
            <div style="color: red;"><strong>❌ 퇴실체크 실패: ${error.message}</strong></div>
        `;
        alert('퇴실체크에 실패했습니다: ' + error.message);
    } finally {
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = '퇴실체크';
    }
}
