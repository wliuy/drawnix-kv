/** Version: v1.0.19 - Pages Functions Ready */
import { useState, useEffect, useRef } from 'react';
import { Drawnix } from '@drawnix/drawnix';
import { PlaitElement, PlaitTheme, Viewport } from '@plait/core';

/**
 * --- Pages Functions 生产配置 ---
 * 使用相对路径，部署后自动指向项目根目录下的 functions 接口
 */
const WORKER_URL = '/api'; 
const BOARD_ID = 'my-drawnix-board'; 

// 安全获取密码逻辑
const getSitePassword = () => {
  try {
    // @ts-ignore
    return import.meta.env?.VITE_PASSWORD || '123456';
  } catch (e) {
    return '123456';
  }
};
const SITE_PASSWORD = getSitePassword();

type AppValue = {
  children: PlaitElement[];
  viewport?: Viewport;
  theme?: PlaitTheme;
};

type SyncStatus = 'synced' | 'pending' | 'syncing' | 'error';

export function App() {
  const [value, setValue] = useState<AppValue>({ children: [] });
  const [tutorial, setTutorial] = useState(false);
  const [status, setStatus] = useState<SyncStatus>('synced');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const saveTimer = useRef<any>(null);
  const isLoaded = useRef(false);

  // 1. 初始化加载逻辑
  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated) return;
      try {
        const response = await fetch(`${WORKER_URL}?id=${BOARD_ID}`);
        if (response.ok) {
          const storedData = await response.json() as AppValue;
          if (storedData && storedData.children && storedData.children.length > 0) {
            setValue(storedData);
            setTutorial(false);
          } else {
            setTutorial(true);
          }
          setStatus('synced');
          isLoaded.current = true;
        } else if (response.status === 404) {
          setTutorial(true);
          setStatus('synced');
          isLoaded.current = true;
        } else {
          setStatus('error');
        }
      } catch (err) {
        console.error('Load Error:', err);
        setStatus('error');
        setTutorial(true);
      }
    };
    loadData();
  }, [isAuthenticated]);

  // 2. 云端同步逻辑 (带 1.5s 防抖)
  const syncToCloud = (data: AppValue) => {
    if (!isLoaded.current) return;
    setStatus('pending');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setStatus('syncing');
      try {
        const response = await fetch(`${WORKER_URL}?id=${BOARD_ID}`, {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          setTimeout(() => setStatus('synced'), 300);
        } else {
          setStatus('error');
        }
      } catch (err) {
        console.error('Sync Error:', err);
        setStatus('error');
      }
    }, 1500); 
  };

  const handleVerify = () => {
    if (passwordInput === SITE_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  // 认证界面
  if (!isAuthenticated) {
    return (
      <div style={{ 
        width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', 
        justifyContent: 'center', background: '#f4f7f9', position: 'fixed', top: 0, left: 0, zIndex: 99999
      }}>
        <div style={{
          padding: '40px 32px', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)',
          borderRadius: '16px', border: '1px solid #e0e0e0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
          display: 'flex', flexDirection: 'column', gap: '24px', width: '350px', fontFamily: '-apple-system, sans-serif'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 600, color: '#111', marginBottom: '8px' }}>云端画板验证</div>
            <div style={{ fontSize: '14px', color: '#666' }}>数据将自动同步至 Cloudflare KV</div>
          </div>
          <div>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setAuthError(false); }}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              placeholder="请输入访问密码"
              style={{ 
                width: '100%', padding: '14px', borderRadius: '8px', border: authError ? '1.5px solid #ff4d4f' : '1.5px solid #ddd', 
                outline: 'none', fontSize: '15px', boxSizing: 'border-box'
              }}
            />
            {authError && <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '8px' }}>密码错误，请检查项目环境变量</div>}
          </div>
          <button onClick={handleVerify} style={{ padding: '14px', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '15px' }}>
            确认进入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* 同步状态指示灯 */}
      <div className={`sync-indicator ${status}`}>
        <div className="dot"></div>
        <span className="status-text">
          {status === 'synced' && '已同步'}
          {status === 'syncing' && '同步中'}
          {status === 'pending' && '待同步'}
          {status === 'error' && '同步失败'}
        </span>
      </div>

      <style>{`
        .sync-indicator {
          position: fixed; top: 3px; right: 38px; z-index: 10000;
          display: flex; align-items: center; gap: 6px; padding: 6px 12px;
          background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(4px);
          border-radius: 6px; border: 1px solid #e8e8e8; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          font-family: -apple-system, sans-serif; pointer-events: none;
        }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .synced .dot { background: #52c41a; box-shadow: 0 0 4px rgba(82, 196, 26, 0.4); }
        .pending .dot { background: #ff4d4f; }
        .syncing .dot { background: #faad14; animation: sync-blink 0.5s infinite alternate; }
        .error .dot { background: #333; }
        .status-text { font-size: 12px; font-weight: 500; color: #666; }
        @keyframes sync-blink { from { opacity: 1; } to { opacity: 0.3; } }
      `}</style>

      <Drawnix
        value={value.children}
        viewport={value.viewport}
        theme={value.theme}
        onChange={(val) => {
          const newValue = val as AppValue;
          setValue(newValue);
          syncToCloud(newValue);
          if (newValue.children && newValue.children.length > 0) setTutorial(false);
        }}
        tutorial={tutorial}
      />
    </div>
  );
}

export default App;