import {
  validateLearningGoal,
  validateInterests,
  validateCurrentConcerns,
  validateUserInput,
  isFormValid,
  sanitizeUserInput
} from '../validation';
import { UserInput } from '@/types';

describe('Validation Utils', () => {
  describe('validateLearningGoal', () => {
    it('빈 값일 때 에러를 반환해야 함', () => {
      expect(validateLearningGoal('')).toBe('학습 목표를 입력해주세요.');
      expect(validateLearningGoal('   ')).toBe('학습 목표를 입력해주세요.');
    });

    it('5자 미만일 때 에러를 반환해야 함', () => {
      expect(validateLearningGoal('짧음')).toBe('학습 목표를 5자 이상 입력해주세요.');
    });

    it('200자 초과일 때 에러를 반환해야 함', () => {
      const longText = 'a'.repeat(201);
      expect(validateLearningGoal(longText)).toBe('학습 목표는 200자 이하로 입력해주세요.');
    });

    it('유효한 입력일 때 undefined를 반환해야 함', () => {
      expect(validateLearningGoal('웹 개발자가 되고 싶습니다')).toBeUndefined();
    });
  });

  describe('validateInterests', () => {
    it('빈 값일 때 에러를 반환해야 함', () => {
      expect(validateInterests('')).toBe('관심 분야를 입력해주세요.');
    });

    it('3자 미만일 때 에러를 반환해야 함', () => {
      expect(validateInterests('JS')).toBe('관심 분야를 3자 이상 입력해주세요.');
    });

    it('100자 초과일 때 에러를 반환해야 함', () => {
      const longText = 'a'.repeat(101);
      expect(validateInterests(longText)).toBe('관심 분야는 100자 이하로 입력해주세요.');
    });

    it('유효한 입력일 때 undefined를 반환해야 함', () => {
      expect(validateInterests('React, Node.js')).toBeUndefined();
    });
  });

  describe('validateCurrentConcerns', () => {
    it('빈 값일 때 에러를 반환해야 함', () => {
      expect(validateCurrentConcerns('')).toBe('현재 고민을 입력해주세요.');
    });

    it('10자 미만일 때 에러를 반환해야 함', () => {
      expect(validateCurrentConcerns('짧은 고민')).toBe('현재 고민을 10자 이상 구체적으로 입력해주세요.');
    });

    it('1000자 초과일 때 에러를 반환해야 함', () => {
      const longText = 'a'.repeat(1001);
      expect(validateCurrentConcerns(longText)).toBe('현재 고민은 1000자 이하로 입력해주세요.');
    });

    it('유효한 입력일 때 undefined를 반환해야 함', () => {
      expect(validateCurrentConcerns('프로그래밍 학습 순서를 모르겠습니다')).toBeUndefined();
    });
  });

  describe('validateUserInput', () => {
    it('모든 필드가 유효할 때 빈 객체를 반환해야 함', () => {
      const validInput: UserInput = {
        learningGoal: '웹 개발자가 되고 싶습니다',
        interests: 'React, Node.js',
        currentConcerns: '프로그래밍 학습 순서를 모르겠습니다'
      };
      
      const errors = validateUserInput(validInput);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('유효하지 않은 필드가 있을 때 해당 에러를 반환해야 함', () => {
      const invalidInput: UserInput = {
        learningGoal: '',
        interests: 'JS',
        currentConcerns: '짧음'
      };
      
      const errors = validateUserInput(invalidInput);
      expect(errors.learningGoal).toBeDefined();
      expect(errors.interests).toBeDefined();
      expect(errors.currentConcerns).toBeDefined();
    });
  });

  describe('isFormValid', () => {
    it('에러가 없을 때 true를 반환해야 함', () => {
      expect(isFormValid({})).toBe(true);
    });

    it('에러가 있을 때 false를 반환해야 함', () => {
      expect(isFormValid({ learningGoal: '에러 메시지' })).toBe(false);
    });
  });

  describe('sanitizeUserInput', () => {
    it('입력값의 앞뒤 공백을 제거해야 함', () => {
      const input: UserInput = {
        learningGoal: '  웹 개발자  ',
        interests: '  React, Node.js  ',
        currentConcerns: '  학습 고민입니다  '
      };
      
      const sanitized = sanitizeUserInput(input);
      expect(sanitized.learningGoal).toBe('웹 개발자');
      expect(sanitized.interests).toBe('React, Node.js');
      expect(sanitized.currentConcerns).toBe('학습 고민입니다');
    });
  });
});