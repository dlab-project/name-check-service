const SUPABASE_URL = 'https://avdxuubamsjuwwojqonb.supabase.co'
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZHh1dWJhbXNqdXd3b2pxb25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjI1MjcsImV4cCI6MjA3MDI5ODUyN30.KvZZyC44-0_scfXVv55S9DGskCFmBP378Ke_ZwUUi9w"
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 학번 저장 변수
let studentId = '';
let checkoutStudentId = '';
let isCheckoutMode = false;


// 학번 입력 모달 관련 코드
function showStudentIdModal() {
    document.getElementById('studentIdModal').style.display = 'flex';
    document.getElementById('studentIdInput').value = '';
    document.getElementById('studentIdError').style.display = 'none';
    // 모달 제목 변경
    document.querySelector('#studentIdModal h2').textContent = isCheckoutMode ? '퇴실 학번 입력' : '학번 입력';
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
    if (isCheckoutMode) {
        checkoutStudentId = input.trim();
        hideStudentIdModal();
        handleCheckout(checkoutStudentId);
    } else {
        studentId = input.trim();
        hideStudentIdModal();
    }
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
        const now = new Date();
        
        // 한국 시간으로 변환 (UTC+9)
        const koreaNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
        
        // 오늘 날짜만 추출 (시간은 무시하고 날짜만 비교)
        const today = koreaNow.toISOString().split('T')[0]; // YYYY-MM-DD 형식
        
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
            return;
        }
        const currentTime = now.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        // Supabase에 출석 데이터 저장
        const { data, error } = await supabase
            .from('check')
            .insert([
                {
                    student_id: studentId,
                    checkin_time: koreaNow.toISOString()
                }
            ]);
        if (error) {
            throw error;
        }
        timeDisplay.innerHTML = `
            <div style="margin-bottom: 10px; color: green;"><strong>✅ 출석체크가 완료되었습니다!</strong></div>
            <div style="margin-bottom: 10px;"><strong>학번:</strong> ${studentId}</div>
            <div><strong>출석 시간:</strong> ${currentTime}</div>
        `;
        alert('출석체크가 완료되었습니다!');
        console.log('출석 기록 저장 성공:', data);
        
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
    isCheckoutMode = true;
    showStudentIdModal();
});

async function handleCheckout(checkoutStudentId) {
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = '퇴실체크 중...';
    try {
        const now = new Date();
        // 한국 시간으로 변환 (UTC+9)
        const koreaNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
        const currentTime = koreaNow.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        // 오늘 날짜만 추출 (시간은 무시하고 날짜만 비교)
        const today = koreaNow.toISOString().split('T')[0]; // YYYY-MM-DD 형식
        
        // 오늘의 출석 기록 확인 - 날짜만으로 판별
        const { data: todayCheck, error: checkError } = await supabase
            .from('check')
            .select('*')
            .eq('student_id', checkoutStudentId)
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
            .update({ checkout_time: koreaNow.toISOString() })
            .eq('student_id', checkoutStudentId)
            .gte('checkin_time', today + 'T00:00:00.000Z')
            .lt('checkin_time', today + 'T23:59:59.999Z');
        if (error) throw error;
        timeDisplay.innerHTML = `
            <div style="margin-bottom: 10px; color: green;"><strong>✅ 퇴실체크가 완료되었습니다!</strong></div>
            <div style="margin-bottom: 10px;"><strong>학번:</strong> ${checkoutStudentId}</div>
            <div><strong>퇴실 시간:</strong> ${currentTime}</div>
        `;
        alert('퇴실체크가 완료되었습니다!');
        console.log('퇴실 시간 저장 성공:', data);
    } catch (error) {
        console.error('퇴실체크 오류:', error);
        timeDisplay.innerHTML = `
            <div style="color: red;"><strong>❌ 퇴실체크 실패: ${error.message}</strong></div>
        `;
        alert('퇴실체크에 실패했습니다: ' + error.message);
    } finally {
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = '퇴실체크';
        isCheckoutMode = false;
    }
}
