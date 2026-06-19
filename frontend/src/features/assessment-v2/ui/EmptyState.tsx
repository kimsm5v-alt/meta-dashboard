import { ExternalLink, Users } from 'lucide-react';
import { openMypageGroups } from '@shared/lib/mypage';

// 그룹 생성이 mypage(SSO)로 이관 — CTA 를 mypage 그룹 관리 이동으로 (group-from-idp)
export const EmptyState = () => {
  return (
    <div className="vj">
      <div className="vj-empty">
        <div className="vj-empty-icon">
          <Users size={24} />
        </div>

        <h2 className="vj-empty-title">아직 그룹이 없습니다</h2>
        <p className="vj-empty-desc">
          마이페이지에서 학급(그룹)을 만들고 학생을 초대하면<br />
          이곳에서 그룹별 검사를 진행할 수 있습니다
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

        <button className="btn primary lg vj-empty-cta" onClick={() => openMypageGroups('create')}>
          그룹 관리하러 가기
          <ExternalLink size={18} />
        </button>
      </div>
    </div>
  );
};
