/**
 * 학번 검증 공통 함수
 * 모든 학번 검증에 사용되는 공통 함수입니다.
 */

/**
 * 학번을 검증하는 함수
 * @param {string} studentId - 검증할 학번 (문자열)
 * @returns {Object} 검증 결과 객체
 * @returns {boolean} isValid - 검증 통과 여부
 * @returns {string} message - 검증 결과 메시지
 */
function validateStudentId(studentId) {
    // 입력값이 없거나 빈 문자열인 경우
    if (!studentId || studentId.trim() === '') {
        return {
            isValid: false,
            message: '학번을 입력해주세요.'
        };
    }

    // 5자리 숫자인지 확인 (정확히 5자리)
    if (!/^\d{5}$/.test(studentId)) {
        if (studentId.length > 5) {
            return {
                isValid: false,
                message: '학번은 정확히 5자리여야 합니다. (현재: ' + studentId.length + '자리)'
            };
        } else if (studentId.length < 5) {
            return {
                isValid: false,
                message: '학번은 5자리 숫자여야 합니다. (현재: ' + studentId.length + '자리)'
            };
        } else {
            return {
                isValid: false,
                message: '학번은 숫자만 입력 가능합니다.'
            };
        }
    }
    
    const digits = studentId.split('').map(Number);
    
    // 첫 번째 자리: 3 이하 (0, 1, 2, 3)
    if (digits[0] > 3 || digits[0] <= 0) {
        return {
            isValid: false,
            message: '첫 번째 자리는 3 이하의 자연수여야 합니다.'
        };
    }
    
    // 두 번째, 세 번째 자리: 15 이하 (01-15)
    const secondThirdDigits = digits[1] * 10 + digits[2];
    if (secondThirdDigits > 15 || secondThirdDigits <= 0) {
        return {
            isValid: false,
            message: '두 번째, 세 번째 자리는 15 이하의 자연수여야 합니다.'
        };
    }
    
    // 네 번째, 다섯 번째 자리: 50 이하 (01-50)
    const fourthFifthDigits = digits[3] * 10 + digits[4];
    if (fourthFifthDigits > 50 || fourthFifthDigits <= 0) {
        return {
            isValid: false,
            message: '네 번째, 다섯 번째 자리는 50 이하의 자연수여야 합니다.'
        };
    }
    
    return {
        isValid: true,
        message: '올바른 학번입니다.'
    };
}

/**
 * 학번 검증 후 에러 표시를 처리하는 공통 함수
 * @param {string} studentId - 검증할 학번
 * @param {HTMLElement} errorElement - 에러 메시지를 표시할 DOM 요소
 * @returns {boolean} 검증 통과 여부
 */
function validateAndShowError(studentId, errorElement) {
    const validation = validateStudentId(studentId);
    
    if (errorElement) {
        if (!validation.isValid) {
            errorElement.textContent = validation.message;
            errorElement.style.display = 'block';
            errorElement.style.color = 'red';
        } else {
            errorElement.textContent = validation.message;
            errorElement.style.display = 'block';
            errorElement.style.color = 'green';
        }
    }
    
    return validation.isValid;
}

/**
 * 출석체크/퇴실체크 시 학번 검증 및 알림 처리
 * @param {string} studentId - 검증할 학번
 * @param {string} actionType - 액션 타입 ('출석체크' 또는 '퇴실체크')
 * @returns {boolean} 검증 통과 여부
 */
function validateForAttendance(studentId, actionType = '출석체크') {
    const validation = validateStudentId(studentId);
    
    if (!validation.isValid) {
        alert(`잘못된 학번입니다: ${validation.message}\n\n${actionType}를 위해 올바른 학번을 입력해주세요.`);
        return false;
    }
    
    return true;
}
