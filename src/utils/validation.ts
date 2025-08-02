import { UserInput, FormErrors } from '@/types';

// 개별 필드 유효성 검사 함수
export const validateLearningGoal = (value: string): string | undefined => {
  if (!value.trim()) {
    return '학습 목표를 입력해주세요.';
  }
  if (value.trim().length < 5) {
    return '학습 목표를 5자 이상 입력해주세요.';
  }
  if (value.trim().length > 200) {
    return '학습 목표는 200자 이하로 입력해주세요.';
  }
  return undefined;
};

export const validateInterests = (value: string): string | undefined => {
  if (!value.trim()) {
    return '관심 분야를 입력해주세요.';
  }
  if (value.trim().length < 3) {
    return '관심 분야를 3자 이상 입력해주세요.';
  }
  if (value.trim().length > 100) {
    return '관심 분야는 100자 이하로 입력해주세요.';
  }
  return undefined;
};

export const validateCurrentConcerns = (value: string): string | undefined => {
  if (!value.trim()) {
    return '현재 고민을 입력해주세요.';
  }
  if (value.trim().length < 10) {
    return '현재 고민을 10자 이상 구체적으로 입력해주세요.';
  }
  if (value.trim().length > 1000) {
    return '현재 고민은 1000자 이하로 입력해주세요.';
  }
  return undefined;
};

// 전체 폼 유효성 검사 함수
export const validateUserInput = (data: UserInput): FormErrors => {
  const errors: FormErrors = {};

  const learningGoalError = validateLearningGoal(data.learningGoal);
  if (learningGoalError) {
    errors.learningGoal = learningGoalError;
  }

  const interestsError = validateInterests(data.interests);
  if (interestsError) {
    errors.interests = interestsError;
  }

  const currentConcernsError = validateCurrentConcerns(data.currentConcerns);
  if (currentConcernsError) {
    errors.currentConcerns = currentConcernsError;
  }

  return errors;
};

// 폼이 유효한지 확인하는 함수
export const isFormValid = (errors: FormErrors): boolean => {
  return Object.keys(errors).length === 0;
};

// 입력 데이터 정제 함수
export const sanitizeUserInput = (data: UserInput): UserInput => {
  return {
    learningGoal: data.learningGoal.trim(),
    interests: data.interests.trim(),
    currentConcerns: data.currentConcerns.trim()
  };
};