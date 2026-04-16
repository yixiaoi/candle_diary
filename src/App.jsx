import React, { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';

const FIELD_LIMITS = {
  date: 30,
  time: 30,
  place: 30,
  ritualName: 30,
  objective: 120,
  candleDetail1: 60,
  candleDetail2: 60,
  color: 30,
  conditionExtra: 30,
  phase2Extra: 30,
  phase3Extra: 30,
  phase4Extra: 30,
  phase5Extra: 30,
  phase6Extra: 30,
  additionalObservation1: 90,
  additionalObservation2: 90,
  keySign1: 30,
  keySign2: 30,
  keySign3: 30,
  interpretation: 120,
  review1: 60,
  review2: 60,
  review3: 28,
  review4: 28,
  note1: 90,
  note2: 28,
};

const TEXT_FIELDS = {
  date: '',
  time: '',
  place: '',
  ritualName: '',
  objective: '',
  candleDetail1: '',
  candleDetail2: '',
  color: '',
  conditionExtra: '',
  phase2Extra: '',
  phase3Extra: '',
  phase4Extra: '',
  phase5Extra: '',
  phase6Extra: '',
  additionalObservation1: '',
  additionalObservation2: '',
  keySign1: '',
  keySign2: '',
  keySign3: '',
  interpretation: '',
  review1: '',
  review2: '',
  review3: '',
  review4: '',
  note1: '',
  note2: '',
};

const MULTI_DEFAULTS = {
  candleType: [],
  materials: [],
  condition: [],
  prep: [],
  ignitionBehavior: [],
  smokeDirection: [],
  waxFlow: [],
  waxShapes: [],
  wickTraits: [],
  remains: [],
  nextAction: [],
};

const SINGLE_DEFAULTS = {
  ignitionEase: '',
  flameHeight: '',
  flameStability: '',
  smokeColor: '',
  completeBurn: '',
};

const SectionTitle = ({ en, cn }) => (
  <div className="section-title">
    <span className="section-title-en">{en}</span>
    <span className="section-title-cn">{cn}</span>
  </div>
);

const LineInput = ({
  label,
  value,
  onChange,
  maxLength,
  placeholder,
  className = '',
  align = 'left',
  dense = false,
  mono = false,
}) => (
  <label className={`line-field ${dense ? 'line-field-dense' : ''} ${className}`.trim()}>
    {label ? <span className="field-label">{label}</span> : null}
    <span className="line-shell">
      <input
        className={`line-input ${align === 'right' ? 'line-input-right' : ''} ${
          mono ? 'line-input-mono' : ''
        }`}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        placeholder={placeholder}
      />
      <span className="field-counter">
        {value.length}/{maxLength}
      </span>
    </span>
  </label>
);

const LineTextarea = ({
  label,
  value,
  onChange,
  maxLength,
  maxLines = 3,
  mobileMaxLines,
  placeholder,
  className = '',
}) => {
  const textareaRef = useRef(null);

  const handleChange = (event) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const originalValue = textarea.value;
    let nextValue = event.target.value.replace(/\n+/g, ' ').slice(0, maxLength);

    const computed = window.getComputedStyle(textarea);
    const lineHeight = parseFloat(computed.lineHeight) || 24;
    const paddingTop = parseFloat(computed.paddingTop) || 0;
    const paddingBottom = parseFloat(computed.paddingBottom) || 0;
    const activeMaxLines =
      mobileMaxLines && window.matchMedia('(max-width: 899px)').matches ? mobileMaxLines : maxLines;
    const fallbackMaxHeight = lineHeight * activeMaxLines + paddingTop + paddingBottom;
    const maxHeight = textarea.clientHeight || fallbackMaxHeight;

    textarea.value = nextValue;

    while (textarea.scrollHeight > maxHeight + 1 && nextValue.length > 0) {
      nextValue = nextValue.slice(0, -1);
      textarea.value = nextValue;
    }

    textarea.value = originalValue;

    onChange({
      ...event,
      target: {
        ...event.target,
        value: nextValue,
      },
    });
  };

  return (
    <label className={`line-field ${className}`.trim()}>
      {label ? <span className="field-label">{label}</span> : null}
      <span className="textarea-shell">
        <textarea
          ref={textareaRef}
          className="line-textarea"
          value={value}
          onChange={handleChange}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
            }
          }}
          maxLength={maxLength}
          rows={maxLines}
          placeholder={placeholder}
        />
        <span className="field-counter">
          {value.length}/{maxLength}
        </span>
      </span>
    </label>
  );
};

const ChoiceGroup = ({
  label,
  items,
  selected,
  onChange,
  type = 'multi',
  compact = false,
}) => {
  const selectedValues = Array.isArray(selected) ? selected : [selected].filter(Boolean);

  return (
    <div className="choice-group">
      {label ? <p className="choice-label">{label}</p> : null}
      <div className={`choice-list ${compact ? 'choice-list-compact' : ''}`}>
        {items.map((item) => {
          const isActive = selectedValues.includes(item.value);
          return (
            <button
              key={item.value}
              type="button"
              className={`choice-item ${isActive ? 'choice-item-active' : ''}`}
              onClick={() => onChange(item.value)}
              aria-pressed={isActive}
            >
              <span className="choice-box" />
              <span className="choice-text">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const MOBILE_SECTIONS = [
  { id: 'top', label: '基础' },
  { id: 'phase1', label: '状态' },
  { id: 'phase2', label: '火焰' },
  { id: 'phase3', label: '烟雾' },
  { id: 'phase4', label: '蜡液' },
  { id: 'phase5', label: '烛芯' },
  { id: 'phase6', label: '结果' },
  { id: 'synthesis', label: '综合' },
];

const waitForPaint = () =>
  new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });

const logExportMetrics = ({
  label,
  sourceNode,
  exportClone,
  exportWidth,
  exportHeight,
  pixelRatio,
  canvasWidth,
  canvasHeight,
}) => {
  const singlePageScale = Math.min(1, exportHeight / exportClone.scrollHeight);
  const overflowPixels = Math.max(0, exportClone.scrollHeight - exportHeight);
  const blockMetrics = Array.from(exportClone.querySelectorAll('[data-export-block]')).map((block) => ({
    block: block.getAttribute('data-export-block'),
    clientHeight: block.clientHeight,
    scrollHeight: block.scrollHeight,
  }));

  console.group(`[Export Diagnostics] ${label}`);
  console.log('paper element clientWidth / clientHeight', {
    clientWidth: sourceNode.clientWidth,
    clientHeight: sourceNode.clientHeight,
  });
  console.log('paper element scrollWidth / scrollHeight', {
    scrollWidth: sourceNode.scrollWidth,
    scrollHeight: sourceNode.scrollHeight,
  });
  console.log('export clone clientWidth / clientHeight', {
    clientWidth: exportClone.clientWidth,
    clientHeight: exportClone.clientHeight,
  });
  console.log('export clone scrollWidth / scrollHeight', {
    scrollWidth: exportClone.scrollWidth,
    scrollHeight: exportClone.scrollHeight,
  });
  console.log('final exportWidth / exportHeight', {
    exportWidth,
    exportHeight,
  });
  console.log('final canvasWidth / canvasHeight', {
    canvasWidth,
    canvasHeight,
  });
  console.log('window.devicePixelRatio', window.devicePixelRatio);
  console.log('single-page fit analysis', {
    overflowPixels,
    recommendedScale: Number(singlePageScale.toFixed(4)),
    recommendedPercent: `${Math.round(singlePageScale * 100)}%`,
  });
  console.table(blockMetrics);
  console.groupEnd();
};

const App = () => {
  const [fields, setFields] = useState(TEXT_FIELDS);
  const [multiSelect, setMultiSelect] = useState(MULTI_DEFAULTS);
  const [singleSelect, setSingleSelect] = useState(SINGLE_DEFAULTS);
  const [activeSection, setActiveSection] = useState('top');
  const [isExporting, setIsExporting] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const paperRef = useRef(null);
  const diagnosticRef = useRef(null);

  const updateField = (key) => (event) => {
    setFields((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const toggleMulti = (group, value) => {
    setMultiSelect((prev) => {
      const current = prev[group];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [group]: next };
    });
  };

  const toggleSingle = (group, value) => {
    setSingleSelect((prev) => ({
      ...prev,
      [group]: prev[group] === value ? '' : value,
    }));
  };

  const exportNodeToPng = async (node, label = 'candle-record') => {
    if (!node || isExporting) return;

    setIsExporting(true);
    await waitForPaint();

    try {
      const exportWidth = 1080;
      const exportHeight = Math.round(exportWidth * 1.414);
      const exportHost = document.createElement('div');
      exportHost.style.position = 'fixed';
      exportHost.style.inset = '0';
      exportHost.style.opacity = '0';
      exportHost.style.pointerEvents = 'none';
      exportHost.style.overflow = 'hidden';
      exportHost.style.zIndex = '-1';
      exportHost.style.background = 'transparent';

      const exportClone = node.cloneNode(true);
      exportClone.classList.add('export-mode');
      exportClone.style.position = 'absolute';
      exportClone.style.left = '0';
      exportClone.style.top = '0';
      exportClone.style.width = `${exportWidth}px`;
      exportClone.style.height = `${exportHeight}px`;
      exportClone.style.minHeight = `${exportHeight}px`;
      exportClone.style.margin = '0';
      exportClone.style.pointerEvents = 'none';
      exportClone.style.overflow = 'hidden';
      exportHost.appendChild(exportClone);
      document.body.appendChild(exportHost);

      const pixelRatio = Math.min(3, Math.max(2, window.devicePixelRatio || 2));
      let dataUrl = '';
      const canvasWidth = exportWidth * pixelRatio;
      const canvasHeight = exportHeight * pixelRatio;

      logExportMetrics({
        label,
        sourceNode: node,
        exportClone,
        exportWidth,
        exportHeight,
        pixelRatio,
        canvasWidth,
        canvasHeight,
      });

      try {
        dataUrl = await toPng(exportClone, {
          cacheBust: true,
          pixelRatio,
          backgroundColor: '#f9f6f0',
          width: exportWidth,
          height: exportHeight,
          canvasWidth,
          canvasHeight,
          style: {
            margin: '0',
          },
        });
      } finally {
        exportHost.remove();
      }

      const link = document.createElement('a');
      const isTouchDevice =
        window.matchMedia('(pointer: coarse)').matches ||
        /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);

      if (isTouchDevice) {
        setPreviewImage(dataUrl);
      } else {
        link.download = `${label}-${fields.date || 'export'}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error('PNG export failed:', error);
      window.alert('导出失败，请稍后重试。');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPng = async () => {
    await exportNodeToPng(paperRef.current, 'candle-record');
  };

  useEffect(() => {
    const handleFocus = (event) => {
      const section = event.target.closest('[data-mobile-section]');
      if (section) {
        setActiveSection(section.getAttribute('data-mobile-section'));
      }
    };

    window.addEventListener('focusin', handleFocus);
    return () => window.removeEventListener('focusin', handleFocus);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 360);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closePreview = () => {
    setPreviewImage('');
  };

  const clearAll = () => {
    const confirmed = window.confirm('确定要清空当前填写内容和勾选状态吗？');
    if (!confirmed) return;

    setFields({ ...TEXT_FIELDS });
    setMultiSelect({ ...MULTI_DEFAULTS });
    setSingleSelect({ ...SINGLE_DEFAULTS });
    setPreviewImage('');
    setActiveSection('top');
  };

  return (
    <div className="app-shell">
      <div className="toolbar">
        <div className="toolbar-copy">
          <p className="toolbar-kicker">蜡烛记录 / Candle Record</p>
          <h1 className="toolbar-title">
            喜欢的话可以到我的小红书
            <a
              className="toolbar-link"
              href="https://xhslink.com/m/7d26IkR5FoA"
              target="_blank"
              rel="noreferrer"
            >
              @UMchinnn🦋
            </a>
            点个赞，上面会有更多的工具发布
          </h1>
        </div>
        <div className="toolbar-actions">
          <div className="mobile-jump" aria-label="Mobile section navigation">
            {MOBILE_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`jump-chip ${activeSection === section.id ? 'jump-chip-active' : ''}`}
                onClick={() =>
                  document
                    .querySelector(`[data-mobile-section="${section.id}"]`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              >
                {section.label}
              </button>
            ))}
          </div>
          <div className="toolbar-button-row">
            <button type="button" className="export-button secondary-button" onClick={clearAll} disabled={isExporting}>
              一键清空
            </button>
            <button type="button" className="export-button" onClick={exportToPng} disabled={isExporting}>
              {isExporting ? '保存中…' : '保存图片'}
            </button>
          </div>
          <p className="toolbar-mobile-note">
            喜欢的话可以到我的小红书
            <a
              className="toolbar-link"
              href="https://xhslink.com/m/7d26IkR5FoA"
              target="_blank"
              rel="noreferrer"
            >
              @UMchinnn🦋
            </a>
            点个赞，上面会有更多的工具发布
          </p>
        </div>
      </div>

      <div
        ref={paperRef}
        className={`paper-sheet ${isExporting ? 'export-mode' : ''}`}
        aria-label="Ritual record paper"
      >
        <div className="paper-texture" />

        <header className="paper-header" data-mobile-section="top" data-export-block="header">
          <div className="paper-title-group">
            <p className="paper-kicker">观察存档</p>
            <h2 className="paper-title paper-title-cn">蜡烛观察记录</h2>
            <p className="paper-subtitle">模板与网页来自umi</p>
          </div>
        </header>

        <section className="top-grid surface-block" data-mobile-section="top" data-export-block="top-grid">
          <div className="info-column info-column-left info-column-border">
            <LineInput
              label="日期 / Date"
              value={fields.date}
              onChange={updateField('date')}
              maxLength={FIELD_LIMITS.date}
              className="font-date"
              dense
            />
            <LineInput
              label="时间 / Time"
              value={fields.time}
              onChange={updateField('time')}
              maxLength={FIELD_LIMITS.time}
              className="font-time"
              dense
            />
            <LineInput
              label="地点 / Place"
              value={fields.place}
              onChange={updateField('place')}
              maxLength={FIELD_LIMITS.place}
              className="font-place"
              dense
            />
            <LineInput
              label="Ritual / 仪式名称"
              value={fields.ritualName}
              onChange={updateField('ritualName')}
              maxLength={FIELD_LIMITS.ritualName}
              className="font-ritual"
            />
          </div>

          <div className="info-column info-column-center info-column-border">
            <LineTextarea
              label="Objective / 目的"
              value={fields.objective}
              onChange={updateField('objective')}
              maxLength={FIELD_LIMITS.objective}
              maxLines={4}
              mobileMaxLines={8}
              className="objective-field"
            />
            <LineTextarea
              label="Candle Details / 蜡烛补充信息"
              value={fields.candleDetail1 + (fields.candleDetail2 ? ` ${fields.candleDetail2}` : '')}
              onChange={(event) => {
                const value = event.target.value;
                setFields((prev) => ({
                  ...prev,
                  candleDetail1: value,
                  candleDetail2: '',
                }));
              }}
              maxLength={60}
              maxLines={2}
              mobileMaxLines={4}
              className="details-field"
            />
          </div>

          <div className="info-column info-column-right">
            <LineInput
              label="颜色 / Color"
              value={fields.color}
              onChange={updateField('color')}
              maxLength={FIELD_LIMITS.color}
              dense
            />
            <ChoiceGroup
              label="Candle Type / 类型"
              type="multi"
              compact
              items={[
                { label: '柱蜡', value: 'pillar' },
                { label: '罐蜡', value: 'jar' },
                { label: '茶蜡', value: 'tealight' },
              ]}
              selected={multiSelect.candleType}
              onChange={(value) => toggleMulti('candleType', value)}
            />
            <ChoiceGroup
              label="Materials / 辅助材料"
              type="multi"
              compact
              items={[
                { label: '姓名纸', value: 'paper' },
                { label: '照片', value: 'photo' },
                { label: '草药', value: 'herb' },
                { label: '油', value: 'oil' },
              ]}
              selected={multiSelect.materials}
              onChange={(value) => toggleMulti('materials', value)}
            />
          </div>
        </section>

        <div className="middle-grid">
          <div className="column-stack column-stack-left">
            <section className="surface-block phase-block phase-block-open" data-mobile-section="phase1" data-export-block="phase-01">
              <SectionTitle en="Phase 01" cn="状态与准备" />
              <ChoiceGroup
                label="Condition / 状态"
                type="multi"
                items={[
                  { label: '平静', value: 'calm' },
                  { label: '紧张', value: 'tense' },
                  { label: '疲惫', value: 'tired' },
                  { label: '情绪重', value: 'heavy' },
                  { label: '专注', value: 'focused' },
                ]}
                selected={multiSelect.condition}
                onChange={(value) => toggleMulti('condition', value)}
              />
              <LineInput
                value={fields.conditionExtra}
                onChange={updateField('conditionExtra')}
                maxLength={FIELD_LIMITS.conditionExtra}
              />
              <ChoiceGroup
                label="Prep / 仪式准备"
                type="multi"
                compact
                items={[
                  { label: '保护', value: 'protection' },
                  { label: '清理', value: 'cleansing' },
                  { label: '冥想', value: 'meditation' },
                ]}
                selected={multiSelect.prep}
                onChange={(value) => toggleMulti('prep', value)}
              />
            </section>

            <section className="surface-block phase-block phase-block-dense" data-mobile-section="phase2" data-export-block="phase-02">
              <SectionTitle en="Phase 02" cn="火焰动态" />
              <ChoiceGroup
                label="Ignition / 点燃"
                type="single"
                compact
                items={[
                  { label: '顺利', value: 'smooth' },
                  { label: '困难', value: 'hard' },
                ]}
                selected={singleSelect.ignitionEase}
                onChange={(value) => toggleSingle('ignitionEase', value)}
              />
              <ChoiceGroup
                label="Flame Behavior / 火焰状态"
                type="multi"
                items={[
                  { label: '稳定', value: 'stable' },
                  { label: '摇晃', value: 'flicker' },
                  { label: '忽明忽暗', value: 'dim' },
                  { label: '弱', value: 'weak' },
                  { label: '高', value: 'strong' },
                ]}
                selected={multiSelect.ignitionBehavior}
                onChange={(value) => toggleMulti('ignitionBehavior', value)}
              />
              <div className="two-up">
                <ChoiceGroup
                  label="高度 / Height"
                  type="single"
                  compact
                  items={[
                    { label: '低', value: 'low' },
                    { label: '中', value: 'mid' },
                    { label: '高', value: 'high' },
                  ]}
                  selected={singleSelect.flameHeight}
                  onChange={(value) => toggleSingle('flameHeight', value)}
                />
                <ChoiceGroup
                  label="稳定 / Stability"
                  type="single"
                  compact
                  items={[
                    { label: '稳', value: 'stable' },
                    { label: '跳', value: 'jump' },
                  ]}
                  selected={singleSelect.flameStability}
                  onChange={(value) => toggleSingle('flameStability', value)}
                />
              </div>
              <LineInput
                value={fields.phase2Extra}
                onChange={updateField('phase2Extra')}
                maxLength={FIELD_LIMITS.phase2Extra}
              />
            </section>

            <section className="surface-block phase-block phase-block-light" data-mobile-section="phase3" data-export-block="phase-03">
              <SectionTitle en="Phase 03" cn="烟雾与气味" />
              <ChoiceGroup
                label="烟雾 / Smoke"
                type="single"
                compact
                items={[
                  { label: '无', value: 'none' },
                  { label: '白', value: 'white' },
                  { label: '黑', value: 'black' },
                ]}
                selected={singleSelect.smokeColor}
                onChange={(value) => toggleSingle('smokeColor', value)}
              />
              <ChoiceGroup
                label="Direction / 烟雾方向"
                type="multi"
                items={[
                  { label: '朝我', value: 'toward-me' },
                  { label: '远离', value: 'away' },
                  { label: '左', value: 'left' },
                  { label: '右', value: 'right' },
                  { label: '上升', value: 'up' },
                  { label: '旋转', value: 'spin' },
                ]}
                selected={multiSelect.smokeDirection}
                onChange={(value) => toggleMulti('smokeDirection', value)}
              />
              <LineInput
                value={fields.phase3Extra}
                onChange={updateField('phase3Extra')}
                maxLength={FIELD_LIMITS.phase3Extra}
              />
            </section>
          </div>

          <div className="column-stack column-stack-right column-divider">
            <section className="surface-block phase-block phase-block-anchor" data-mobile-section="phase4" data-export-block="phase-04">
              <SectionTitle en="Phase 04" cn="蜡液观察" />
              <ChoiceGroup
                label="Flow / 蜡流方向"
                type="multi"
                items={[
                  { label: '左', value: 'left' },
                  { label: '右', value: 'right' },
                  { label: '前', value: 'front' },
                  { label: '后', value: 'back' },
                  { label: '四周', value: 'around' },
                  { label: '目标物', value: 'target' },
                ]}
                selected={multiSelect.waxFlow}
                onChange={(value) => toggleMulti('waxFlow', value)}
              />
              <ChoiceGroup
                label="Wax Forms / 形态"
                type="multi"
                items={[
                  { label: '无泪', value: 'no-tears' },
                  { label: '少量', value: 'few' },
                  { label: '山/塔', value: 'mountain' },
                  { label: '花瓣', value: 'petal' },
                  { label: '漩涡', value: 'vortex' },
                  { label: '特殊', value: 'special' },
                ]}
                selected={multiSelect.waxShapes}
                onChange={(value) => toggleMulti('waxShapes', value)}
              />
              <LineInput
                value={fields.phase4Extra}
                onChange={updateField('phase4Extra')}
                maxLength={FIELD_LIMITS.phase4Extra}
              />
            </section>

            <section className="surface-block phase-block phase-block-compact" data-mobile-section="phase5" data-export-block="phase-05">
              <SectionTitle en="Phase 05" cn="烛芯特征" />
              <ChoiceGroup
                label="Wick / 烛芯"
                type="multi"
                items={[
                  { label: '正常', value: 'normal' },
                  { label: '卷曲', value: 'curl' },
                  { label: '结花', value: 'flower' },
                  { label: '淹没', value: 'sink' },
                  { label: '断裂', value: 'break' },
                ]}
                selected={multiSelect.wickTraits}
                onChange={(value) => toggleMulti('wickTraits', value)}
              />
              <LineInput
                value={fields.phase5Extra}
                onChange={updateField('phase5Extra')}
                maxLength={FIELD_LIMITS.phase5Extra}
              />
            </section>

            <section className="surface-block phase-block phase-block-anchor" data-mobile-section="phase6" data-export-block="phase-06">
              <SectionTitle en="Phase 06" cn="燃烧结果" />
              <ChoiceGroup
                label="是否烧完 / Complete?"
                type="single"
                compact
                items={[
                  { label: '是', value: 'yes' },
                  { label: '否', value: 'no' },
                ]}
                selected={singleSelect.completeBurn}
                onChange={(value) => toggleSingle('completeBurn', value)}
              />
              <ChoiceGroup
                label="Remains / 残余"
                type="multi"
                items={[
                  { label: '无残留', value: 'none' },
                  { label: '底座', value: 'base' },
                  { label: '残蜡', value: 'wax' },
                  { label: '黑灰', value: 'ash' },
                ]}
                selected={multiSelect.remains}
                onChange={(value) => toggleMulti('remains', value)}
              />
              <div className="stack-lines">
                <LineTextarea
                  label="Additional Observations / 观察补充"
                  value={[
                    fields.additionalObservation1,
                    fields.additionalObservation2,
                    fields.note1,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFields((prev) => ({
                      ...prev,
                      additionalObservation1: value,
                      additionalObservation2: '',
                      note1: '',
                    }));
                  }}
                  maxLength={90}
                  maxLines={3}
                  mobileMaxLines={6}
                  className="observations-field"
                />
              </div>
              <LineInput
                value={fields.phase6Extra}
                onChange={updateField('phase6Extra')}
                maxLength={FIELD_LIMITS.phase6Extra}
              />
            </section>
          </div>
        </div>

        <section className="summary-section summary-block surface-block" data-mobile-section="synthesis" data-export-block="summary">
          <div className="summary-grid">
            <div className="summary-main">
              <SectionTitle en="Synthesis" cn="综合观察判断" />
              <div className="summary-columns">
                <div>
                  <p className="summary-label">Key Signs / 核心征象</p>
                  <div className="stack-lines key-signs-lines">
                    <div className="numbered-line">
                      <span className="line-index">1</span>
                      <LineInput
                        value={fields.keySign1}
                        onChange={updateField('keySign1')}
                        maxLength={FIELD_LIMITS.keySign1}
                      />
                    </div>
                    <div className="numbered-line">
                      <span className="line-index">2</span>
                      <LineInput
                        value={fields.keySign2}
                        onChange={updateField('keySign2')}
                        maxLength={FIELD_LIMITS.keySign2}
                      />
                    </div>
                    <div className="numbered-line">
                      <span className="line-index">3</span>
                      <LineInput
                        value={fields.keySign3}
                        onChange={updateField('keySign3')}
                        maxLength={FIELD_LIMITS.keySign3}
                      />
                    </div>
                  </div>
                </div>
                <LineTextarea
                  label="Interpretation / 解读"
                  value={fields.interpretation}
                  onChange={updateField('interpretation')}
                  maxLength={FIELD_LIMITS.interpretation}
                  maxLines={4}
                  mobileMaxLines={8}
                  className="interpretation-field"
                />
              </div>
            </div>
            <aside className="next-action-box archive-note-box">
              <p className="next-action-title">下一步 / Next Action</p>
              <ChoiceGroup
                type="multi"
                compact
                items={[
                  { label: '持续观察', value: 'observe' },
                  { label: '复做', value: 'redo' },
                  { label: '清理空间', value: 'clean' },
                  { label: '暂停', value: 'pause' },
                  { label: '结束', value: 'end' },
                ]}
                selected={multiSelect.nextAction}
                onChange={(value) => toggleMulti('nextAction', value)}
              />
            </aside>
          </div>

          <div className="footer-notes">
            <div className="notes-block" data-export-block="review">
              <div className="notes-heading">
                <span>Review / 回溯复盘</span>
                <span className="notes-rule" />
              </div>
              <div className="stack-lines">
                <LineTextarea
                  value={[fields.review1, fields.review2].filter(Boolean).join(' ')}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFields((prev) => ({
                      ...prev,
                      review1: value,
                      review2: '',
                    }));
                  }}
                  maxLength={FIELD_LIMITS.review1}
                  maxLines={2}
                  mobileMaxLines={4}
                  className="review-field"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="archive-watermark">存档 / Archive</div>
      </div>

      <div className="diagnostic-stage" aria-hidden="true">
        <div ref={diagnosticRef} className="diagnostic-sheet">
          <div className="diagnostic-title-row">
            <span className="diagnostic-kicker">诊断导出 / Diagnostic Export</span>
            <span className="diagnostic-note">最小长页测试 / Minimal long-page test</span>
          </div>
          <div className="diagnostic-lines">
            {Array.from({ length: 22 }).map((_, index) => (
              <div key={index} className="diagnostic-line-group">
                <div className="diagnostic-label">第 {String(index + 1).padStart(2, '0')} 行 / Line {String(index + 1).padStart(2, '0')}</div>
                <div className="diagnostic-line" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        className={`back-to-top ${showBackToTop ? 'back-to-top-visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        顶部 / Top
      </button>

      {previewImage ? (
        <div className="export-preview" role="dialog" aria-modal="true" aria-label="PNG preview">
          <div className="export-preview-panel">
            <div className="export-preview-head">
              <div>
                <p className="export-preview-kicker">图片预览 / PNG Preview</p>
                <h2 className="export-preview-title">长按图片保存到相册</h2>
              </div>
              <button type="button" className="preview-close" onClick={closePreview} aria-label="Close preview">
                关闭 / Close
              </button>
            </div>
            <div className="export-preview-body">
              <img className="export-preview-image" src={previewImage} alt="Ritual record export preview" />
            </div>
          </div>
          <button type="button" className="export-preview-backdrop" onClick={closePreview} aria-label="Close preview" />
        </div>
      ) : null}
    </div>
  );
};

export default App;
