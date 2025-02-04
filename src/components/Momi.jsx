import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './Momi.css';
import confetti from 'canvas-confetti';
import { useSpring, animated } from '@react-spring/web';

const Momi = () => {
  const [formattedData, setFormattedData] = useState([]);
  const [startNumber, setStartNumber] = useState('');
  const [offset, setOffset] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);
  const outputRef = useRef(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [petPosition] = useState(() => ({ x: window.innerWidth - 100, y: 100 }));
  const [petMood, setPetMood] = useState('happy');
  const [bounce, setBounce] = useState(false);

  const themeAnimation = useSpring({
    transform: darkMode ? 'rotate(360deg)' : 'rotate(0deg)',
    config: { tension: 300, friction: 10 }
  });

  const buttonAnimation = useSpring({
    scale: 1,
    from: { scale: 0.9 },
    config: { mass: 1, tension: 200, friction: 10 }
  });

  const petAnimation = useSpring({
    transform: bounce ? 'translateY(-20px)' : 'translateY(0px)',
    config: { tension: 200, friction: 10 }
  });

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      setProgress(100);
    }
  }, [loading]);

  const validateInputs = () => {
    const newErrors = {};
    if (!fileInputRef.current.files.length) {
      newErrors.file = '請選擇一個 Excel 檔案。';
    }
    if (!startNumber || isNaN(startNumber)) {
      newErrors.startNumber = '請輸入有效的起始數字。';
    }
    if (!offset || isNaN(offset)) {
      newErrors.offset = '請輸入有效的偏移值。';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        fileInputRef.current.files = e.dataTransfer.files;
        setErrors(prev => ({ ...prev, file: '' }));
      } else {
        setErrors(prev => ({ ...prev, file: '請上傳 Excel 檔案 (.xlsx 或 .xls)' }));
      }
    }
  };

  const handleProcess = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    setSuccessMessage('');
    setProgress(0);
    
    try {
      const file = fileInputRef.current.files[0];
      const data = await readFile(file);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const startRowIndex = parseInt(startNumber) + parseInt(offset) - 1;
      if (startRowIndex >= jsonData.length) {
        setErrors({ file: `起始數字加偏移值指向的行（第 ${startRowIndex + 1} 行）超出範圍。` });
        return;
      }

      const newFormattedData = [];
      for (let i = 0; i < jsonData.length - startRowIndex; i++) {
        const row = jsonData[i + startRowIndex];
        if (!row) continue;

        const currentNumber = parseInt(startNumber) + i;
        let entry = '🐍🐍新年快樂🥰🎆🎆🎆🎆\n\n';
        entry += `第${currentNumber}位投稿人嚟啦～\n`;
        entry += `名字：${row[1] || 'N/A'}\n`;
        entry += `年齡：${row[2] || 'N/A'}\n`;
        entry += `身高：${row[3] || 'N/A'}\n\n`;
        entry += `描述自已：${row[4] || 'N/A'}\n\n`;
        entry += `要求：${row[5] || 'N/A'}\n\n`;
        entry += `聯絡方式：${row[6] || 'N/A'}\n\n`;

        entry += '如果有緣人想認識無留tg既投稿人，可以dm平台的！🙊🙊🙊🙊🙊\n';
        entry += '投稿link係主頁🧨大家隨意投稿🎐\n\n';

        newFormattedData.push({ text: entry, hasPhoto: !!row[7] });
      }

      setFormattedData(newFormattedData);
      setSuccessMessage('處理完成！您現在可以下載檔案。');
      runFireworks();
      
      // Scroll to output
      if (outputRef.current) {
        outputRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      setErrors({ file: '處理過程中出現錯誤，請檢查您的 Excel 檔案格式。' });
    } finally {
      setLoading(false);
    }
  };

  const readFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleDownload = () => {
    const text = formattedData.map(entry => entry.text).join('\n\n------------------------\n\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'formatted_data.txt';
    link.click();
    URL.revokeObjectURL(link.href);

    // Show success animation
    setSuccessMessage('檔案已成功下載！');
    setTimeout(() => setSuccessMessage(''), 3000);

    runFireworks();
  };

  const handleCopyToClipboard = async () => {
    const text = formattedData.map(entry => entry.text).join('\n\n------------------------\n\n');
    try {
      await navigator.clipboard.writeText(text);
      setSuccessMessage('已複製到剪貼板！');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrors({ clipboard: '複製失敗，請手動複製。' });
    }
  };

  const handlePreview = async () => {
    if (!fileInputRef.current.files.length) return;
    const file = fileInputRef.current.files[0];
    const data = await readFile(file);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    setPreviewData(jsonData.slice(0, 5));
    setShowPreview(true);
  };

  const runFireworks = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      colors: ['#4299e1', '#48bb78', '#f6e05e', '#f56565'],
      particleCount: 50,
      spread: 100
    };

    confetti({ ...defaults, angle: 60 });
    confetti({ ...defaults, angle: 120 });
    
    for (let i = 0; i < count; i++) {
      confetti({
        ...defaults,
        particleCount: 1,
        startVelocity: 0,
        gravity: 0.3 - (Math.random() * 0.1),
        ticks: 200 + (Math.random() * 50)
      });
    }
  };

  const handlePetInteraction = () => {
    setBounce(true);
    setTimeout(() => setBounce(false), 1000);
    runFireworks();
    setPetMood(['happy', 'surprised', 'excited'][Math.floor(Math.random() * 3)]);
  };

  return (
    <div className={`container ${darkMode ? 'dark-mode' : ''}`}>
      <animated.div 
        className="theme-toggle" 
        style={themeAnimation}
        onClick={() => setDarkMode(!darkMode)}
      >
        {darkMode ? '🌞' : '🌙'}
      </animated.div>

      {showPreview && (
        <div className="preview-modal">
          <div className="preview-content">
            <h3>檔案預覽 <i className="fas fa-table"></i></h3>
            <table>
              <tbody>
                {previewData.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => <td key={j}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            <button 
              className="close-preview"
              onClick={() => setShowPreview(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      <button
        className="preview-btn"
        onClick={handlePreview}
        disabled={!fileInputRef.current?.files?.length}
      >
        <i className="fas fa-eye"></i>
        預覽檔案
      </button>

      <div 
        className={`drop-zone ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="input-group">
          <label>
            <i className="fas fa-file-excel button-icon"></i>
            選擇 Excel 檔案
          </label>
          <input 
            type="file" 
            ref={fileInputRef}
            accept=".xlsx, .xls"
            onChange={() => setErrors(prev => ({ ...prev, file: '' }))}
          />
          {errors.file && (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              {errors.file}
            </div>
          )}
        </div>
      </div>

      <div className="input-group">
        <label>
          <i className="fas fa-sort-numeric-down button-icon"></i>
          起始數字
        </label>
        <input
          type="number"
          value={startNumber}
          onChange={(e) => {
            setStartNumber(e.target.value);
            setErrors(prev => ({ ...prev, startNumber: '' }));
          }}
          placeholder="請輸入起始數字"
        />
        {errors.startNumber && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            {errors.startNumber}
          </div>
        )}
      </div>

      <div className="input-group">
        <label>
          <i className="fas fa-arrows-alt-v button-icon"></i>
          偏移值
        </label>
        <input
          type="number"
          value={offset}
          onChange={(e) => {
            setOffset(e.target.value);
            setErrors(prev => ({ ...prev, offset: '' }));
          }}
          placeholder="請輸入偏移值"
        />
        {errors.offset && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            {errors.offset}
          </div>
        )}
      </div>

      <animated.button 
        className="process-btn" 
        style={buttonAnimation}
        onClick={handleProcess} 
        disabled={loading}
      >
        <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-file-import'} button-icon`}></i>
        {loading ? '處理中...' : '處理檔案'}
      </animated.button>

      {loading && (
        <div className="progress-bar">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {successMessage && (
        <div className="success-message">
          <i className="fas fa-party-horn"></i>
          {successMessage}
          <span className="celebrate-emoji">🎉</span>
        </div>
      )}

      {formattedData.length > 0 && (
        <div ref={outputRef}>
          <div className="output-header">
            <h3>
              <i className="fas fa-file-alt button-icon"></i>
              處理結果
            </h3>
            <button 
              className="copy-btn"
              onClick={handleCopyToClipboard}
              title="複製到剪貼板"
            >
              <i className="fas fa-copy"></i>
            </button>
          </div>
          <div className="output">
            {formattedData.map((entry, index) => (
              <div key={index} className="output-entry">
                <pre>{entry.text}</pre>
                {entry.hasPhoto && (
                  <div className="photo-indicator">
                    <span className="photo-indicator-text">此投稿包含照片</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button className="download-btn" onClick={handleDownload}>
            <i className="fas fa-download button-icon"></i>
            下載檔案
          </button>
        </div>
      )}

      <animated.div 
        className="virtual-pet"
        style={{
          ...petAnimation,
          left: petPosition.x,
          top: petPosition.y,
        }}
        onClick={handlePetInteraction}
      >
        <span role="img" aria-label="pet">
          {petMood === 'happy' ? '🐶' : petMood === 'surprised' ? '😲' : '🐾'}
        </span>
        <div className="pet-message">Click me!</div>
      </animated.div>
    </div>
  );
};

export default Momi;