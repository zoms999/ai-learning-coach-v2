import puppeteer from 'puppeteer';
import { ChatSession } from '@/stores/chatStore';
import { Recommendation } from '@/types';

export interface PDFExportOptions {
  session: ChatSession;
  includeRecommendations?: boolean;
  includeTimestamps?: boolean;
  format?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
}

export class PDFGenerator {
  private static async generateHTML(options: PDFExportOptions): Promise<string> {
    const { session, includeRecommendations = true, includeTimestamps = true } = options;
    
    const formatDate = (date: Date) => {
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const formatContent = (content: string) => {
      return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>')
        .replace(/🔗 (https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color: #2563eb; text-decoration: underline;">$1</a>');
    };

    const getCategoryColor = (category: string) => {
      const colors = {
        '학습': '#dbeafe',
        '기술': '#dcfce7',
        '커리어': '#f3e8ff',
        '도구': '#fed7aa',
        '리소스': '#fce7f3',
        '프로젝트': '#e0e7ff',
      };
      return colors[category as keyof typeof colors] || '#f3f4f6';
    };

    const getPriorityIcon = (priority: number) => {
      if (priority <= 2) return '🔥';
      if (priority <= 4) return '⭐';
      return '💡';
    };

    return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI 학습 코치 - ${session.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif;
            line-height: 1.6;
            color: #374151;
            background: #ffffff;
            padding: 40px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .header h1 {
            color: #1f2937;
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .header .subtitle {
            color: #6b7280;
            font-size: 16px;
            margin-bottom: 20px;
        }
        
        .session-info {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        
        .session-info h2 {
            color: #1f2937;
            font-size: 20px;
            margin-bottom: 10px;
        }
        
        .session-meta {
            display: flex;
            gap: 20px;
            font-size: 14px;
            color: #6b7280;
        }
        
        .messages-section {
            margin-bottom: 40px;
        }
        
        .section-title {
            color: #1f2937;
            font-size: 22px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .message {
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 8px;
            page-break-inside: avoid;
        }
        
        .message.user {
            background: #dcfce7;
            border-left: 4px solid #16a34a;
        }
        
        .message.ai {
            background: #dbeafe;
            border-left: 4px solid #2563eb;
        }
        
        .message-header {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .message-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            margin-right: 10px;
            font-size: 14px;
        }
        
        .message.user .message-avatar {
            background: #16a34a;
        }
        
        .message.ai .message-avatar {
            background: #2563eb;
        }
        
        .message-content {
            font-size: 15px;
            line-height: 1.7;
        }
        
        .message-timestamp {
            font-size: 12px;
            color: #6b7280;
            margin-top: 8px;
        }
        
        .recommendations-section {
            margin-top: 40px;
        }
        
        .recommendation-card {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        
        .recommendation-header {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .recommendation-icon {
            font-size: 18px;
            margin-right: 10px;
        }
        
        .recommendation-category {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            margin-left: auto;
        }
        
        .recommendation-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 10px;
        }
        
        .recommendation-description {
            font-size: 14px;
            line-height: 1.6;
            color: #4b5563;
            margin-bottom: 15px;
        }
        
        .recommendation-priority {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 12px;
            color: #6b7280;
        }
        
        .priority-dots {
            display: flex;
            gap: 3px;
        }
        
        .priority-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }
        
        .priority-dot.active {
            background: #3b82f6;
        }
        
        .priority-dot.inactive {
            background: #d1d5db;
        }
        
        .recommendation-url {
            margin-top: 10px;
            font-size: 13px;
        }
        
        .recommendation-url a {
            color: #2563eb;
            text-decoration: none;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        
        @media print {
            body {
                padding: 20px;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .section-title {
                font-size: 18px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 AI 학습 코치</h1>
        <div class="subtitle">개인화된 학습 조언 및 추천사항</div>
    </div>
    
    <div class="session-info">
        <h2>${session.title}</h2>
        <div class="session-meta">
            <span>📅 생성일: ${formatDate(new Date(session.createdAt))}</span>
            <span>🔄 수정일: ${formatDate(new Date(session.updatedAt))}</span>
            <span>💬 메시지: ${session.messages.length}개</span>
            ${includeRecommendations ? `<span>💡 추천사항: ${session.recommendations.length}개</span>` : ''}
        </div>
    </div>
    
    <div class="messages-section">
        <h2 class="section-title">💬 대화 내용</h2>
        ${session.messages.map(message => `
            <div class="message ${message.type}">
                <div class="message-header">
                    <div class="message-avatar">${message.type === 'user' ? 'U' : 'AI'}</div>
                    <strong>${message.type === 'user' ? '사용자' : 'AI 학습 코치'}</strong>
                </div>
                <div class="message-content">
                    ${formatContent(message.content)}
                </div>
                ${includeTimestamps ? `
                    <div class="message-timestamp">
                        ${formatDate(new Date(message.timestamp))}
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>
    
    ${includeRecommendations && session.recommendations.length > 0 ? `
        <div class="recommendations-section">
            <h2 class="section-title">💡 맞춤형 추천사항</h2>
            ${session.recommendations
              .sort((a, b) => a.priority - b.priority)
              .map(rec => `
                <div class="recommendation-card">
                    <div class="recommendation-header">
                        <span class="recommendation-icon">${getPriorityIcon(rec.priority)}</span>
                        <div class="recommendation-category" style="background-color: ${getCategoryColor(rec.category)};">
                            ${rec.category}
                        </div>
                    </div>
                    <div class="recommendation-title">${rec.title}</div>
                    <div class="recommendation-description">
                        ${formatContent(rec.description)}
                    </div>
                    <div class="recommendation-priority">
                        <span>우선순위: ${rec.priority}/5</span>
                        <div class="priority-dots">
                            ${Array.from({ length: 5 }, (_, i) => `
                                <div class="priority-dot ${i < (6 - rec.priority) ? 'active' : 'inactive'}"></div>
                            `).join('')}
                        </div>
                    </div>
                    ${rec.url ? `
                        <div class="recommendation-url">
                            🔗 <a href="${rec.url}">${rec.url}</a>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    ` : ''}
    
    <div class="footer">
        <p>이 문서는 AI 학습 코치에서 생성되었습니다.</p>
        <p>생성 시간: ${formatDate(new Date())}</p>
    </div>
</body>
</html>
    `;
  }

  static async generatePDF(options: PDFExportOptions): Promise<Buffer> {
    let browser;
    
    try {
      // Puppeteer 브라우저 실행
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      
      // HTML 생성
      const html = await this.generateHTML(options);
      
      // HTML을 페이지에 설정
      await page.setContent(html, {
        waitUntil: 'networkidle0'
      });

      // PDF 생성 옵션
      const pdfOptions = {
        format: options.format || 'A4' as const,
        orientation: options.orientation || 'portrait' as const,
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      };

      // PDF 생성
      const pdfBuffer = await page.pdf(pdfOptions);
      
      return pdfBuffer;
      
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      throw new Error('PDF 생성 중 오류가 발생했습니다.');
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  static generateFileName(session: ChatSession): string {
    const date = new Date().toISOString().split('T')[0];
    const title = session.title.replace(/[^a-zA-Z0-9가-힣\s]/g, '').substring(0, 30);
    return `AI학습코치_${title}_${date}.pdf`;
  }
}