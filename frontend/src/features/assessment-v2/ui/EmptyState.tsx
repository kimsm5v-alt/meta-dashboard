import { Plus, Users } from 'lucide-react';

interface EmptyStateProps {
  onCreateGroup: () => void;
}

export const EmptyState = ({ onCreateGroup }: EmptyStateProps) => {
  return (
    <div className="vj">
      <div className="vj-empty">
        <div className="vj-empty-icon">
          <Users size={24} />
        </div>

        <h2 className="vj-empty-title">첫 번째 그룹을 만들어보세요</h2>
        <p className="vj-empty-desc">
          그룹을 생성하고 학생들을 초대하면<br />
          학습심리정서검사를 시작할 수 있습니다
        </p>

        <div className="vj-empty-steps">
          <div className="vj-step">
            <div className="vj-step-num">1</div>
            <div className="vj-step-txt">
              <b>그룹 생성</b>
              <span>학년·반 설정</span>
            </div>
          </div>
          <div className="vj-step-line" />
          <div className="vj-step">
            <div className="vj-step-num">2</div>
            <div className="vj-step-txt">
              <b>학생 초대</b>
              <span>코드·링크 공유</span>
            </div>
          </div>
          <div className="vj-step-line" />
          <div className="vj-step">
            <div className="vj-step-num">3</div>
            <div className="vj-step-txt">
              <b>검사 시작</b>
              <span>결과 분석 확인</span>
            </div>
          </div>
        </div>

        <button className="btn primary lg vj-empty-cta" onClick={onCreateGroup}>
          <Plus size={18} />
          첫 번째 그룹 만들기
        </button>
      </div>
    </div>
  );
};
