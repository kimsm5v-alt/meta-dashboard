/**
 * 빈 상태 화면 - vj-empty 디자인 스타일
 * 디자인 핸드오프: Variant J (vj-empty + vj-step)
 */

import { Users, UserPlus, Plus } from 'lucide-react';
import emptyIllust from '@/assets/empty-illust.png';

interface EmptyStateProps {
  onCreateGroup: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onCreateGroup }) => {
  return (
    <div className="vj">
      <div className="vj-empty">
        {/* 아이콘 */}
        <div className="vj-empty-icon">
          <Users size={26} />
        </div>

        {/* 헤드라인 */}
        <h2 className="vj-empty-title">
          그룹을 만들고 검사를 시작해 보세요
        </h2>

        {/* 설명 */}
        <p className="vj-empty-desc">
          먼저 그룹을 생성해 학생을 초대하세요.<br />
          그룹이 만들어지면 학습심리정서검사를 시작하고 결과도 확인할 수 있어요.
        </p>

        {/* 일러스트 */}
        <div className="vj-empty-illust" style={{ margin: '6px 0 8px' }}>
          <img
            src={emptyIllust}
            alt=""
            style={{
              display: 'block',
              margin: '0 auto',
              width: '520px',
              maxWidth: '100%',
              height: 'auto',
            }}
          />
        </div>

        {/* 2단계 가이드 */}
        <div className="vj-empty-steps">
          {/* Step 1 */}
          <div className="vj-step">
            <div className="vj-step-num">1</div>
            <div className="vj-step-ic">
              <Users size={16} />
            </div>
            <div className="vj-step-txt">
              <b>그룹 생성</b>
              <span>새 그룹을 만들어 보세요.</span>
            </div>
          </div>

          {/* 연결선 */}
          <div className="vj-step-line" />

          {/* Step 2 */}
          <div className="vj-step">
            <div className="vj-step-num">2</div>
            <div className="vj-step-ic">
              <UserPlus size={16} />
            </div>
            <div className="vj-step-txt">
              <b>학생 초대 후 검사 시작</b>
              <span>학생을 초대하고 검사를 시작하세요.</span>
            </div>
          </div>
        </div>

        {/* CTA 버튼 */}
        <button
          onClick={onCreateGroup}
          className="btn primary lg vj-empty-cta"
        >
          <Plus size={18} />
          그룹 만들기
        </button>
      </div>
    </div>
  );
};

export default EmptyState;
