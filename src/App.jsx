import React, { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';

const FIELD_LIMITS = {
  date: 16,
  time: 12,
  place: 18,
  ritualName: 28,
  objective: 56,
  candleDetail1: 24,
  candleDetail2: 24,
  color: 16,
  conditionExtra: 24,
  additionalObservation1: 28,
  additionalObservation2: 28,
  keySign1: 18,
  keySign2: 18,
  keySign3: 18,
  interpretation: 110,
  review1: 28,
  review2: 28,
  review3: 28,
  review4: 28,
  note1: 28,
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
  rows = 3,
  placeholder,
  className = '',
}) => (
  <label className={`line-field ${className}`.trim()}>
    {label ? <span className="field-label">{label}</span> : null}
    <span className="textarea-shell">
      <textarea
        className="line-textarea"
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        rows={rows}
        placeholder={placeholder}
      />
      <span className="field-counter">
        {value.length}/{maxLength}
      </span>
    </span>
  </label>
);

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

const App = () => {
  const [fields, setFields] = useState(TEXT_FIELDS);
  const [multiSelect, setMultiSelect] = useState(MULTI_DEFAULTS);
  const [singleSelect, setSingleSelect] = useState(SINGLE_DEFAULTS);
  const [activeSection, setActiveSection] = useState('top');
  const [isExporting, setIsExporting] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const paperRef = useRef(null);

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

  const exportToPng = async () => {
    const node = paperRef.current;
    if (!node || isExporting) return;

    setIsExporting(true);
    await waitForPaint();

    try {
      const pixelRatio = Math.min(3, Math.max(2, window.devicePixelRatio || 2));
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio,
        backgroundColor: '#f9f6f0',
        style: {
          margin: '0',
        },
      });

      const link = document.createElement('a');
      const isTouchDevice =
        window.matchMedia('(pointer: coarse)').matches ||
        /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);

      if (isTouchDevice) {
        setPreviewImage(dataUrl);
      } else {
        link.download = `ritual-record-${fields.date || 'export'}.png`;
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

  return (
    <div className="app-shell">
      <div className="toolbar">
        <div>
          <p className="toolbar-kicker">Candle Record</p>
          <h1 className="toolbar-title">Editable archive sheet</h1>
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
          <button type="button" className="export-button" onClick={exportToPng} disabled={isExporting}>
            {isExporting ? 'Exporting…' : 'Export PNG'}
          </button>
        </div>
      </div>

      <div
        ref={paperRef}
        className={`paper-sheet ${isExporting ? 'export-mode' : ''}`}
        aria-label="Ritual record paper"
      >
        <div className="paper-texture" />

        <header className="paper-header" data-mobile-section="top">
          <div className="paper-title-group">
            <p className="paper-kicker">Private Archive</p>
            <h2 className="paper-title">Candle Record</h2>
            <p className="paper-subtitle">Archive / Private Observation</p>
          </div>
        </header>

        <section className="top-grid surface-block" data-mobile-section="top">
          <div className="info-column info-column-left info-column-border">
            <LineInput
              label="Date"
              value={fields.date}
              onChange={updateField('date')}
              maxLength={FIELD_LIMITS.date}
              dense
            />
            <LineInput
              label="Time"
              value={fields.time}
              onChange={updateField('time')}
              maxLength={FIELD_LIMITS.time}
              dense
            />
            <LineInput
              label="Place"
              value={fields.place}
              onChange={updateField('place')}
              maxLength={FIELD_LIMITS.place}
              dense
            />
            <LineInput
              label="Ritual / 仪式名称"
              value={fields.ritualName}
              onChange={updateField('ritualName')}
              maxLength={FIELD_LIMITS.ritualName}
            />
          </div>

          <div className="info-column info-column-center info-column-border">
            <LineTextarea
              label="Objective / 目的"
              value={fields.objective}
              onChange={updateField('objective')}
              maxLength={FIELD_LIMITS.objective}
              rows={4}
            />
            <LineInput
              label="Candle Details / 蜡烛补充信息"
              value={fields.candleDetail1}
              onChange={updateField('candleDetail1')}
              maxLength={FIELD_LIMITS.candleDetail1}
            />
            <LineInput
              value={fields.candleDetail2}
              onChange={updateField('candleDetail2')}
              maxLength={FIELD_LIMITS.candleDetail2}
            />
          </div>

          <div className="info-column info-column-right">
            <LineInput
              label="Color"
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
            <section className="surface-block phase-block phase-block-open" data-mobile-section="phase1">
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
                label="Additional State"
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
                ]}
                selected={multiSelect.prep}
                onChange={(value) => toggleMulti('prep', value)}
              />
            </section>

            <section className="surface-block phase-block phase-block-dense" data-mobile-section="phase2">
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
                  label="Height"
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
                  label="Stability"
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
            </section>

            <section className="surface-block phase-block phase-block-light" data-mobile-section="phase3">
              <SectionTitle en="Phase 03" cn="烟雾与气味" />
              <ChoiceGroup
                label="Smoke"
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
            </section>
          </div>

          <div className="column-stack column-stack-right column-divider">
            <section className="surface-block phase-block phase-block-anchor" data-mobile-section="phase4">
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
            </section>

            <section className="surface-block phase-block phase-block-compact" data-mobile-section="phase5">
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
            </section>

            <section className="surface-block phase-block phase-block-anchor" data-mobile-section="phase6">
              <SectionTitle en="Phase 06" cn="燃烧结果" />
              <ChoiceGroup
                label="Complete?"
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
                <LineInput
                  label="Additional Observations / 观察补充"
                  value={fields.additionalObservation1}
                  onChange={updateField('additionalObservation1')}
                  maxLength={FIELD_LIMITS.additionalObservation1}
                />
                <LineInput
                  value={fields.additionalObservation2}
                  onChange={updateField('additionalObservation2')}
                  maxLength={FIELD_LIMITS.additionalObservation2}
                />
              </div>
            </section>
          </div>
        </div>

        <section className="summary-section summary-block surface-block" data-mobile-section="synthesis">
          <div className="summary-grid">
            <div className="summary-main">
              <SectionTitle en="Synthesis" cn="综合观察判断" />
              <div className="summary-columns">
                <div>
                  <p className="summary-label">Key Signs / 核心征象</p>
                  <div className="stack-lines">
                    <LineInput
                      value={fields.keySign1}
                      onChange={updateField('keySign1')}
                      maxLength={FIELD_LIMITS.keySign1}
                    />
                    <LineInput
                      value={fields.keySign2}
                      onChange={updateField('keySign2')}
                      maxLength={FIELD_LIMITS.keySign2}
                    />
                    <LineInput
                      value={fields.keySign3}
                      onChange={updateField('keySign3')}
                      maxLength={FIELD_LIMITS.keySign3}
                    />
                  </div>
                </div>
                <LineTextarea
                  label="Interpretation / 解读"
                  value={fields.interpretation}
                  onChange={updateField('interpretation')}
                  maxLength={FIELD_LIMITS.interpretation}
                  rows={6}
                  className="interpretation-field"
                />
              </div>
            </div>
            <aside className="next-action-box archive-note-box">
              <p className="next-action-title">Next Action</p>
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
            <div className="notes-block">
              <div className="notes-heading">
                <span>Review / 回溯复盘</span>
                <span className="notes-rule" />
              </div>
              <div className="stack-lines">
                <LineInput
                  value={fields.review1}
                  onChange={updateField('review1')}
                  maxLength={FIELD_LIMITS.review1}
                />
                <LineInput
                  value={fields.review2}
                  onChange={updateField('review2')}
                  maxLength={FIELD_LIMITS.review2}
                />
                <LineInput
                  value={fields.review3}
                  onChange={updateField('review3')}
                  maxLength={FIELD_LIMITS.review3}
                />
                <LineInput
                  value={fields.review4}
                  onChange={updateField('review4')}
                  maxLength={FIELD_LIMITS.review4}
                />
              </div>
            </div>

            <div className="notes-block">
              <div className="notes-heading subtle">
                <span>Other Notes / 其他补充状态</span>
                <span className="notes-rule" />
              </div>
              <div className="stack-lines">
                <LineInput
                  value={fields.note1}
                  onChange={updateField('note1')}
                  maxLength={FIELD_LIMITS.note1}
                />
                <LineInput
                  value={fields.note2}
                  onChange={updateField('note2')}
                  maxLength={FIELD_LIMITS.note2}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="archive-watermark">Archive</div>
      </div>

      <button
        type="button"
        className={`back-to-top ${showBackToTop ? 'back-to-top-visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        Top
      </button>

      {previewImage ? (
        <div className="export-preview" role="dialog" aria-modal="true" aria-label="PNG preview">
          <div className="export-preview-panel">
            <div className="export-preview-head">
              <div>
                <p className="export-preview-kicker">PNG Preview</p>
                <h2 className="export-preview-title">长按图片保存到相册</h2>
              </div>
              <button type="button" className="preview-close" onClick={closePreview} aria-label="Close preview">
                Close
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
