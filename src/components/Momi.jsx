import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './Momi.css';

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

        newFormattedData.push(entry);
      }

      setFormattedData(newFormattedData);
      setSuccessMessage('處理完成！您現在可以下載檔案。');
      
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
    const text = formattedData.join('\n\n------------------------\n\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'formatted_data.txt';
    link.click();
    URL.revokeObjectURL(link.href);

    // Show success animation
    setSuccessMessage('檔案已成功下載！');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleCopyToClipboard = async () => {
    const text = formattedData.join('\n\n------------------------\n\n');
    try {
      await navigator.clipboard.writeText(text);
      setSuccessMessage('已複製到剪貼板！');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrors({ clipboard: '複製失敗，請手動複製。' });
    }
  };

  return (
    <div className="container">
      <h1>Momi 格式轉換器</h1>
      
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

      <button 
        className="process-btn" 
        onClick={handleProcess} 
        disabled={loading}
      >
        <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-file-import'} button-icon`}></i>
        {loading ? '處理中...' : '處理檔案'}
      </button>

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
          <i className="fas fa-check-circle"></i>
          {successMessage}
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
            {formattedData.join('\n\n------------------------\n\n')}
          </div>
          <button className="download-btn" onClick={handleDownload}>
            <i className="fas fa-download button-icon"></i>
            下載檔案
          </button>
        </div>
      )}
    </div>
  );
};

export default Momi;