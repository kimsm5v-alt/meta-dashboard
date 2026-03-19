import { useState } from 'react';
import './index.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="glass-panel">
      <h1>Meta Dashboard</h1>
      <p>
        새로운 React 기반 프론트엔드 환경입니다.
        아름답고 모던한 UI를 구축하세요.
      </p>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          상호작용 테스트 (클릭 횟수: {count})
        </button>
      </div>
    </div>
  );
}

export default App;
