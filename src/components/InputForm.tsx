'use client';

import { useState } from 'react';
import { UserInput, FormErrors } from '@/types';
import { 
  validateLearningGoal, 
  validateInterests, 
  validateCurrentConcerns,
  validateUserInput,
  isFormValid,
  sanitizeUserInput
} from '@/utils/validation';

interface InputFormProps {
  onSubmit: (data: UserInput) => void;
  isLoading?: boolean;
}

export default function InputForm({ onSubmit, isLoading = false }: InputFormProps) {
  const [formData, setFormData] = useState<UserInput>({
    learningGoal: '',
    interests: '',
    currentConcerns: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<keyof UserInput, boolean>>({
    learningGoal: false,
    interests: false,
    currentConcerns: false
  });

  // 실시간 유효성 검사
  const validateField = (name: keyof UserInput, value: string): string | undefined => {
    switch (name) {
      case 'learningGoal':
        return validateLearningGoal(value);
      case 'interests':
        return validateInterests(value);
      case 'currentConcerns':
        return validateCurrentConcerns(value);
    }
    return undefined;
  };

  // 전체 폼 유효성 검사
  const validateForm = (): boolean => {
    const validationErrors = validateUserInput(formData);
    setErrors(validationErrors);
    return isFormValid(validationErrors);
  };

  const handleInputChange = (name: keyof UserInput, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 실시간 유효성 검사 (필드가 터치된 경우에만)
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (name: keyof UserInput) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 모든 필드를 터치된 것으로 표시
    setTouched({
      learningGoal: true,
      interests: true,
      currentConcerns: true
    });

    if (validateForm()) {
      // 입력 데이터 정제 후 제출
      const sanitizedData = sanitizeUserInput(formData);
      onSubmit(sanitizedData);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          AI 학습 코치에게 상담받기
        </h2>
        <p className="text-gray-600">
          당신의 학습 목표와 현재 상황을 알려주시면, AI가 맞춤형 학습 조언을 제공해드립니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 학습 목표 입력 */}
        <div>
          <label htmlFor="learningGoal" className="block text-sm font-medium text-gray-700 mb-2">
            학습 목표 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="learningGoal"
            value={formData.learningGoal}
            onChange={(e) => handleInputChange('learningGoal', e.target.value)}
            onBlur={() => handleBlur('learningGoal')}
            placeholder="예: 웹 개발자가 되어 취업하고 싶습니다"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
              errors.learningGoal ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors.learningGoal && (
            <p className="mt-1 text-sm text-red-600">{errors.learningGoal}</p>
          )}
        </div>

        {/* 관심 분야 입력 */}
        <div>
          <label htmlFor="interests" className="block text-sm font-medium text-gray-700 mb-2">
            관심 분야 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="interests"
            value={formData.interests}
            onChange={(e) => handleInputChange('interests', e.target.value)}
            onBlur={() => handleBlur('interests')}
            placeholder="예: React, Node.js, 데이터베이스"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
              errors.interests ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors.interests && (
            <p className="mt-1 text-sm text-red-600">{errors.interests}</p>
          )}
        </div>

        {/* 현재 고민 입력 */}
        <div>
          <label htmlFor="currentConcerns" className="block text-sm font-medium text-gray-700 mb-2">
            현재 고민 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="currentConcerns"
            rows={4}
            value={formData.currentConcerns}
            onChange={(e) => handleInputChange('currentConcerns', e.target.value)}
            onBlur={() => handleBlur('currentConcerns')}
            placeholder="예: 프로그래밍을 배우고 있지만 어떤 순서로 공부해야 할지 모르겠고, 실무에서 필요한 기술들이 무엇인지 궁금합니다."
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
              errors.currentConcerns ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors.currentConcerns && (
            <p className="mt-1 text-sm text-red-600">{errors.currentConcerns}</p>
          )}
        </div>

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          } text-white`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              AI가 분석 중입니다...
            </div>
          ) : (
            'AI 학습 조언 받기'
          )}
        </button>
      </form>
    </div>
  );
}