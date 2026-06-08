/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileCode, Code, CheckCircle, AlertTriangle, Copy, Check, Diff, RefreshCw, 
  Terminal, Type, BarChart2, Hash, Calendar, Layers, Minimize2, Maximize2,
  ListPlus, Clock, Play, Pause, Binary, HelpCircle, FileText
} from 'lucide-react';

type MainSectionType = 'data' | 'text' | 'time_conv';

type DataUtilityType = 'json_format' | 'json_validate' | 'yaml_json' | 'xml_format';
type TextUtilityType = 'regex' | 'diff' | 'case' | 'counter' | 'uuid' | 'lorem';
type TimeConvUtilityType = 'epoch' | 'base_conv' | 'unit_conv';

// Standard Cicero words for Lorem Ipsum
const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 
  'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'ut', 
  'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 
  'nisi', 'ut', 'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'dolor', 
  'in', 'reprehenderit', 'in', 'voluptate', 'velit', 'esse', 'cillum', 'dolore', 'eu', 'fugiat', 
  'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 
  'in', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
];

export default function DevUtilities() {
  const [activeTab, setActiveTab] = useState<MainSectionType>('data');

  // Sub-tabs
  const [dataTab, setDataTab] = useState<DataUtilityType>('json_format');
  const [textTab, setTextTab] = useState<TextUtilityType>('regex');
  const [timeConvTab, setTimeConvTab] = useState<TimeConvUtilityType>('epoch');

  // Copied toast state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const triggerCopy = (val: string, id = 'default') => {
    navigator.clipboard.writeText(val);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Platform main utility navigation */}
      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md max-w-lg mx-auto shadow-lg">
        {[
          { id: 'data', label: 'JSON, XML & YAML', icon: <FileCode size={13} /> },
          { id: 'text', label: 'Text Engine Utils', icon: <Type size={13} /> },
          { id: 'time_conv', label: 'Chronos & Conversions', icon: <Calendar size={13} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-grow flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-medium text-xs transition duration-300 cursor-pointer ${
              activeTab === tab.id 
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-semibold shadow-inner' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'data' && (
          <motion.div
            key="data-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Sub Nav */}
            <div className="flex flex-wrap justify-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-xl max-w-xl mx-auto text-xs">
              {[
                { id: 'json_format', label: 'JSON Formatter / Minify' },
                { id: 'json_validate', label: 'JSON Validator' },
                { id: 'yaml_json', label: 'YAML ↔ JSON' },
                { id: 'xml_format', label: 'XML Formatter' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setDataTab(sub.id as any)}
                  className={`py-1.5 px-3 rounded-lg cursor-pointer font-medium transition ${dataTab === sub.id ? 'bg-white/10 text-teal-300 font-bold border border-teal-500/10' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            <DataSectionComponent 
              subTab={dataTab} 
              copiedId={copiedId} 
              onCopy={triggerCopy} 
            />
          </motion.div>
        )}

        {activeTab === 'text' && (
          <motion.div
            key="text-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Sub Nav */}
            <div className="flex flex-wrap justify-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-xl max-w-3xl mx-auto text-xs">
              {[
                { id: 'regex', label: 'Regex Tester' },
                { id: 'diff', label: 'Diff Checker' },
                { id: 'case', label: 'Case Converter' },
                { id: 'counter', label: 'Character / Word Counter' },
                { id: 'uuid', label: 'UUID Generator' },
                { id: 'lorem', label: 'Lorem Generator' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setTextTab(sub.id as any)}
                  className={`py-1.5 px-3 rounded-lg cursor-pointer font-medium transition ${textTab === sub.id ? 'bg-white/10 text-teal-300 font-bold border border-teal-500/10' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            <TextSectionComponent 
              subTab={textTab} 
              copiedId={copiedId} 
              onCopy={triggerCopy} 
            />
          </motion.div>
        )}

        {activeTab === 'time_conv' && (
          <motion.div
            key="time-conv-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Sub Nav */}
            <div className="flex flex-wrap justify-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-xl max-w-md mx-auto text-xs">
              {[
                { id: 'epoch', label: 'Unix Epoch Time' },
                { id: 'base_conv', label: 'Base Converter' },
                { id: 'unit_conv', label: 'Unit Converter' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setTimeConvTab(sub.id as any)}
                  className={`py-1.5 px-3 rounded-lg cursor-pointer font-medium transition ${timeConvTab === sub.id ? 'bg-white/10 text-teal-300 font-bold border border-teal-500/10' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            <TimeConvSectionComponent 
              subTab={timeConvTab} 
              copiedId={copiedId} 
              onCopy={triggerCopy} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// -------------------------------------------------------------
// Component 1: DATA UTILITY CHANNEL
// -------------------------------------------------------------
interface DataSectionProps {
  subTab: DataUtilityType;
  copiedId: string | null;
  onCopy: (val: string, id?: string) => void;
}

function DataSectionComponent({ subTab, copiedId, onCopy }: DataSectionProps) {
  // Common state
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [jsonSpaces, setJsonSpaces] = useState<number>(2);

  const loadTextTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setInputText('');
    setOutputText('');
    setErrorText('');
    setSuccessText('');
  }, [subTab]);

  // Specific triggers
  const handleJSONFormat = (minify = false) => {
    if (!inputText) return;
    try {
      setErrorText('');
      setSuccessText('');
      const parsed = JSON.parse(inputText);
      if (minify) {
        const out = JSON.stringify(parsed);
        setOutputText(out);
        setSuccessText('Minified JSON successfully');
      } else {
        const out = JSON.stringify(parsed, null, jsonSpaces);
        setOutputText(out);
        setSuccessText('Formatted JSON successfully');
      }
    } catch (err: any) {
      setErrorText(`JSON format error: ${err.message}`);
    }
  };

  const handleJSONValidate = () => {
    if (!inputText) {
      setErrorText('Please enter JSON text to validate.');
      setSuccessText('');
      return;
    }
    try {
      setErrorText('');
      JSON.parse(inputText);
      setSuccessText('Valid JSON syntax confirmed. Well-formed schema string.');
    } catch (err: any) {
      setErrorText(`Invalid JSON structure: ${err.message}`);
      setSuccessText('');
    }
  };

  // Safe XML Formatting tag parsing
  const handleXMLFormat = () => {
    if (!inputText.trim()) return;
    try {
      setErrorText('');
      setSuccessText('');
      
      const xmlStr = inputText.trim();
      let formatted = '';
      const padString = ' '.repeat(jsonSpaces);
      let indent = 0;
      
      // Split using a regex that captures tags, handles nested and spacing elements
      const reg = /(<[^>]+>)/g;
      const tokens = xmlStr.replace(reg, '\r\n$1\r\n').split('\r\n');
      
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i].trim();
        if (!token) continue;
        
        if (token.startsWith('</')) {
          indent = Math.max(0, indent - 1);
          formatted += padString.repeat(indent) + token + '\n';
        } else if (token.startsWith('<') && (token.endsWith('/>') || token.endsWith('?>'))) {
          formatted += padString.repeat(indent) + token + '\n';
        } else if (token.startsWith('<!--')) {
          formatted += padString.repeat(indent) + token + '\n';
        } else if (token.startsWith('<') && !token.startsWith('<?')) {
          formatted += padString.repeat(indent) + token + '\n';
          indent++;
        } else {
          formatted += padString.repeat(indent) + token + '\n';
        }
      }
      
      setOutputText(formatted.trim());
      setSuccessText('Formatted XML nodes successfully.');
    } catch (err: any) {
      setErrorText(`XML format error: ${err.message}`);
    }
  };

  // Convert custom YAML to JSON and vice-versa
  const handleYAMLToJSON = () => {
    if (!inputText) return;
    try {
      setErrorText('');
      setSuccessText('');
      
      // Simple custom indentation YAML parser
      const lines = inputText.split('\n');
      const rootObj: any = {};
      const stack: { indent: number; ref: any; key: string | null }[] = [{ indent: -1, ref: rootObj, key: null }];
      
      const cleanVal = (v: string) => {
        v = v.trim();
        if (v === 'true') return true;
        if (v === 'false') return false;
        if (v === 'null') return null;
        if (!isNaN(Number(v)) && v !== '') return Number(v);
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          return v.substring(1, v.length - 1);
        }
        return v;
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim() || line.trim().startsWith('#')) continue;
        
        const indentMatch = line.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1].length : 0;
        const body = line.trim();
        
        // Pop stack to active level
        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
          stack.pop();
        }
        
        const currentRef = stack[stack.length - 1].ref;

        if (body.startsWith('-')) {
          // It's an array element
          const valStr = body.substring(1).trim();
          if (valStr.includes(':')) {
            // Named element list
            const parts = valStr.split(':');
            const k = parts[0].trim();
            const v = cleanVal(parts.slice(1).join(':'));
            const listObj = { [k]: v };
            if (Array.isArray(currentRef)) {
              currentRef.push(listObj);
            } else {
              const activeKey = stack[stack.length - 1].key;
              if (activeKey && !Array.isArray(currentRef[activeKey])) {
                currentRef[activeKey] = [];
              }
              const targetList = activeKey ? currentRef[activeKey] : null;
              if (Array.isArray(targetList)) {
                targetList.push(listObj);
              }
            }
          } else {
            const activeKey = stack[stack.length - 1].key;
            if (activeKey) {
              if (!Array.isArray(currentRef[activeKey])) {
                currentRef[activeKey] = [];
              }
              currentRef[activeKey].push(cleanVal(valStr));
            }
          }
        } else if (body.includes(':')) {
          const parts = body.split(':');
          const k = parts[0].trim();
          const vStr = parts.slice(1).join(':').trim();
          
          if (!vStr) {
            // Nested object
            const newObj = {};
            if (currentRef === rootObj) {
              currentRef[k] = newObj;
            } else {
              currentRef[k] = newObj;
            }
            stack.push({ indent, ref: newObj, key: k });
          } else {
            currentRef[k] = cleanVal(vStr);
            stack[stack.length - 1].key = k;
          }
        }
      }
      
      setOutputText(JSON.stringify(rootObj, null, jsonSpaces));
      setSuccessText('Converted YAML to JSON format successfully.');
    } catch (err: any) {
      setErrorText(`Convert YAML exception: Verify tab blocks or indentations. ${err.message}`);
    }
  };

  const handleJSONToYAML = () => {
    if (!inputText) return;
    try {
      setErrorText('');
      setSuccessText('');
      const parsed = JSON.parse(inputText);
      
      const toYaml = (obj: any, indent = 0): string => {
        const pad = ' '.repeat(indent);
        if (obj === null) return 'null';
        if (typeof obj === 'undefined') return '';
        if (typeof obj !== 'object') {
          if (typeof obj === 'string') {
            if (obj.includes('\n') || obj.includes('"') || obj.includes("'")) {
              return `"${obj.replace(/"/g, '\\"')}"`;
            }
            return obj;
          }
          return String(obj);
        }
        
        if (Array.isArray(obj)) {
          if (obj.length === 0) return '[]';
          let result = '';
          for (const item of obj) {
            if (typeof item === 'object' && item !== null) {
              result += `\n${pad}- ${toYaml(item, indent + 2).trim()}`;
            } else {
              result += `\n${pad}- ${toYaml(item, indent)}`;
            }
          }
          return result;
        }
        
        const keys = Object.keys(obj);
        if (keys.length === 0) return '{}';
        let result = '';
        for (const key of keys) {
          const val = obj[key];
          const hasVal = typeof val !== 'undefined';
          if (!hasVal) continue;
          
          const prefix = result ? '\n' + pad : '';
          if (typeof val === 'object' && val !== null) {
            if (Array.isArray(val) && val.length === 0) {
              result += `${prefix}${key}: []`;
            } else if (!Array.isArray(val) && Object.keys(val).length === 0) {
              result += `${prefix}${key}: {}`;
            } else {
              result += `${prefix}${key}:`;
              result += `\n` + ' '.repeat(indent + 2) + toYaml(val, indent + 2).trim();
            }
          } else {
            result += `${prefix}${key}: ${toYaml(val, indent)}`;
          }
        }
        return result;
      };

      setOutputText(toYaml(parsed, 0));
      setSuccessText('Converted JSON object data to YAML successfully.');
    } catch (err: any) {
      setErrorText(`JSON to YAML parse error: ${err.message}`);
    }
  };

  const loadSampleJSON = () => {
    setInputText(`{
  "name": "developer_toolkit",
  "version": 1.0,
  "offline": true,
  "specifications": {
    "security": "PBKDF2",
    "algorithms": ["AES", "GCM", "ChaCha20"],
    "ports": [3000]
  },
  "metadata": null
}`);
  };

  const loadSampleYAML = () => {
    setInputText(`# Sample YAML Payload config
identity:
  name: Cryptic Station
  version: 2.1
protocols:
  - id: AES-GCM
    bits: 256
  - id: Chacha-Poly
    bits: 256
active: true
debug: null`);
  };

  const loadSampleXML = () => {
    setInputText(`<?xml version="1.0" encoding="UTF-8"?>
<configuration>
<application>
<name>Cryptic Privacy Studio</name>
<version>1.2.0</version>
<developer enabled="true">
<email>dev@example.com</email>
</developer>
</application>
<status code="200">Active Node</status>
</configuration>`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 leading-relaxed">
      {/* Settings layout columns */}
      <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-xl flex flex-col justify-between">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-300 border-b border-white/10 pb-2 flex items-center gap-2">
            <Code className="text-teal-400" size={16} />
            Data Options Panel
          </h4>

          {subTab === 'json_format' && (
            <div className="space-y-3 text-xs text-slate-300">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-sans">Indent spacing</label>
              <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5">
                {[
                  { id: 2, label: '2 spaces' },
                  { id: 4, label: '4 spaces' },
                  { id: 8, label: 'Tabs' }
                ].map((ind) => (
                  <button
                    key={ind.id}
                    onClick={() => setJsonSpaces(ind.id)}
                    className={`flex-1 py-1 rounded text-center text-[10px] cursor-pointer font-bold ${jsonSpaces === ind.id ? 'bg-teal-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {ind.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed pt-1">
                JSON strings can be formatted with custom nesting blocks, or completely minified (whitespace eliminated) to feed API pipelines.
              </p>
              <button
                onClick={loadSampleJSON}
                className="w-full text-left py-1.5 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md font-mono text-[10px] text-slate-400"
              >
                + Load sample JSON string
              </button>
            </div>
          )}

          {subTab === 'json_validate' && (
            <div className="space-y-3 text-xs text-slate-300">
              <p className="text-[11px] text-slate-400 leading-normal font-sans">
                Validator analyzes quotes, trailing commas, parenthesis structures, brackets, and literal constants to isolate structure errors.
              </p>
              <button
                onClick={loadSampleJSON}
                className="w-full text-left py-1.5 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md font-mono text-[10px] text-slate-400"
              >
                + Load malformed sample JSON
              </button>
            </div>
          )}

          {subTab === 'yaml_json' && (
            <div className="space-y-3 text-xs text-slate-300">
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Translating standard YAML (Indentation style lists) to JSON structure representation dictionaries, and parsing nested maps.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={loadSampleYAML}
                  className="py-1.5 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md font-mono text-[9px] text-slate-400 text-center"
                >
                  Load YAML Sample
                </button>
                <button
                  onClick={loadSampleJSON}
                  className="py-1.5 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md font-mono text-[9px] text-slate-400 text-center"
                >
                  Load JSON Sample
                </button>
              </div>
            </div>
          )}

          {subTab === 'xml_format' && (
            <div className="space-y-3 text-xs text-slate-300">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-sans">Indent spaces</label>
              <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5">
                {[
                  { id: 2, label: '2 spaces' },
                  { id: 4, label: '4 spaces' }
                ].map((ind) => (
                  <button
                    key={ind.id}
                    onClick={() => setJsonSpaces(ind.id)}
                    className={`flex-grow py-1 rounded text-center text-[10px] cursor-pointer font-bold ${jsonSpaces === ind.id ? 'bg-teal-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {ind.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 leading-normal font-sans pt-1">
                Formats XML elements by tagging, restoring line wraps, and configuring indentation to make nested structures legible.
              </p>
              <button
                onClick={loadSampleXML}
                className="w-full text-left py-1.5 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md font-mono text-[10px] text-slate-400"
              >
                + Load sample XML string
              </button>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-[9px] text-amber-400 font-mono bg-amber-400/5 p-2 rounded-xl border border-amber-400/10">
            <Terminal size={11} className="shrink-0" />
            Runs entirely Client-Side inside Sandbox.
          </div>
        </div>
      </div>

      {/* Main input blocks */}
      <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Input field */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Input Payload</span>
            <textarea
              rows={8}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Enter text block here...`}
              className="w-full bg-slate-950/40 border border-white/10 rounded-xl p-3 text-slate-200 text-xs font-mono placeholder-slate-700 outline-none resize-none focus:border-teal-500/20"
            />

            {/* Quick functional triggers */}
            <div className="flex gap-2">
              {subTab === 'json_format' && (
                <>
                  <button
                    onClick={() => handleJSONFormat(false)}
                    className="flex-1 py-1.5 bg-teal-500 text-slate-950 hover:bg-teal-400 font-extrabold rounded-lg text-[10px] cursor-pointer"
                  >
                    JSON Pretty
                  </button>
                  <button
                    onClick={() => handleJSONFormat(true)}
                    className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold rounded-lg text-[10px] cursor-pointer"
                  >
                    JSON Minify
                  </button>
                </>
              )}

              {subTab === 'json_validate' && (
                <button
                  onClick={handleJSONValidate}
                  className="w-full py-1.5 bg-teal-500 text-slate-950 hover:bg-teal-400 font-extrabold rounded-lg text-[10px] cursor-pointer"
                >
                  Run Validating Check
                </button>
              )}

              {subTab === 'yaml_json' && (
                <>
                  <button
                    onClick={handleYAMLToJSON}
                    className="flex-1 py-1.5 bg-teal-500 text-slate-950 hover:bg-teal-400 font-bold rounded-lg text-[10px] cursor-pointer"
                  >
                    YAML → JSON
                  </button>
                  <button
                    onClick={handleJSONToYAML}
                    className="flex-1 py-1.5 bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold rounded-lg text-[10px] cursor-pointer"
                  >
                    JSON → YAML
                  </button>
                </>
              )}

              {subTab === 'xml_format' && (
                <button
                  onClick={handleXMLFormat}
                  className="w-full py-1.5 bg-teal-500 text-slate-950 hover:bg-teal-400 font-bold rounded-lg text-[10px] cursor-pointer"
                >
                  XML Format Output
                </button>
              )}
            </div>
          </div>

          {/* Formatted Output */}
          <div className="space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Output Result</span>
              <textarea
                rows={8}
                readOnly
                value={outputText}
                placeholder="Derived formatting compiles instantly..."
                className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-3 text-teal-300 text-xs font-mono placeholder-slate-700 outline-none resize-none"
              />
            </div>

            <button
              onClick={() => onCopy(outputText, 'dataOutcome')}
              disabled={!outputText}
              className="w-full py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 hover:text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              {copiedId === 'dataOutcome' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              Copy Compilation Block
            </button>
          </div>
        </div>

        {/* Validation log boards */}
        {(errorText || successText) && (
          <div className="pt-2 border-t border-white/5">
            {errorText && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-xs font-mono flex items-start gap-2">
                <AlertTriangle className="shrink-0 text-red-400 mt-0.5" size={14} />
                <span className="break-all">{errorText}</span>
              </div>
            )}
            {successText && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs font-mono flex items-center gap-2">
                <CheckCircle className="shrink-0 text-emerald-400" size={14} />
                <span>{successText}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Component 2: TEXT UTILITIES SECTION (Regex, Diff, Case, Count, UUID, Lorem)
// -------------------------------------------------------------
interface TextSectionProps {
  subTab: TextUtilityType;
  copiedId: string | null;
  onCopy: (val: string, id?: string) => void;
}

// DP-LCS Line Diff structures
interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}

function TextSectionComponent({ subTab, copiedId, onCopy }: TextSectionProps) {
  // Regex state
  const [regexPattern, setRegexPattern] = useState('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
  const [regexFlags, setRegexFlags] = useState('g');
  const [regexText, setRegexText] = useState('My emails are dev@example.com and contact-us@cryptic.org.');
  const [regexMatches, setRegexMatches] = useState<any[]>([]);
  const [regexError, setRegexError] = useState('');

  // Sourced and updated fields for Diff checkers
  const [originalDiffText, setOriginalDiffText] = useState('// Version A\nconst status = "offline";\nexport function debug() {\n  console.log("Checking security modules...");\n}');
  const [modifiedDiffText, setModifiedDiffText] = useState('// Version B\nconst status = "sandboxed";\n\nexport function debug() {\n  console.log("Checking security parameters...");\n  console.warn("Complete node isolated!");\n}');
  const [diffResult, setDiffResult] = useState<DiffLine[]>([]);
  const [diffViewMode, setDiffViewMode] = useState<'split' | 'inline'>('inline');

  // Case inputs
  const [caseInText, setCaseInText] = useState('The PBKDF2 parameters are high-entropy keys.');
  const [caseOutText, setCaseOutText] = useState('');

  // Counters
  const [counterText, setCounterText] = useState('Paste your text here to compute real-time typography analytics and word frequencies.');
  const [countStats, setCountStats] = useState({
    charsWithSpaces: 0,
    charsNoSpaces: 0,
    words: 0,
    lines: 0,
    sentences: 0,
    avgWordLength: '0.0',
    topWords: [] as { word: string; count: number }[]
  });

  // UUID
  const [uuidCount, setUuidCount] = useState(5);
  const [uuidUpper, setUuidUpper] = useState(false);
  const [uuidHyphens, setUuidHyphens] = useState(true);
  const [uuidList, setUuidList] = useState<string[]>([]);

  // Lorem
  const [loremCount, setLoremCount] = useState(3);
  const [loremType, setLoremType] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs');
  const [loremResult, setLoremResult] = useState('');

  // Reset strings on tool jump
  useEffect(() => {
    setRegexError('');
  }, [subTab]);

  // 1. REGEX TEST ENGINE
  useEffect(() => {
    if (!regexPattern) {
      setRegexMatches([]);
      setRegexError('');
      return;
    }
    try {
      setRegexError('');
      const re = new RegExp(regexPattern, regexFlags);
      const outputMatches: any[] = [];
      
      if (regexFlags.includes('g')) {
        let match;
        let limit = 0; // Safeguard loop
        while ((match = re.exec(regexText)) !== null && limit < 500) {
          limit++;
          outputMatches.push({
            value: match[0],
            index: match.index,
            groups: match.slice(1)
          });
        }
      } else {
        const match = regexText.match(re);
        if (match) {
          outputMatches.push({
            value: match[0],
            index: match.index || 0,
            groups: match.slice(1)
          });
        }
      }
      setRegexMatches(outputMatches);
    } catch (err: any) {
      setRegexError(err.message || 'Invalid regular expression formula.');
    }
  }, [regexPattern, regexFlags, regexText]);

  // 2. CRYPTIC DIFF LCS ENGINE
  useEffect(() => {
    const s1 = originalDiffText.split('\n');
    const s2 = modifiedDiffText.split('\n');
    const m = s1.length;
    const n = s2.length;
    
    // DP matrix compute
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    
    // Backtracking
    const diff: DiffLine[] = [];
    let i = m;
    let j = n;
    
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && s1[i - 1] === s2[j - 1]) {
        diff.unshift({ type: 'unchanged', value: s1[i - 1] });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        diff.unshift({ type: 'added', value: s2[j - 1] });
        j--;
      } else {
        diff.unshift({ type: 'removed', value: s1[i - 1] });
        i--;
      }
    }
    
    setDiffResult(diff);
  }, [originalDiffText, modifiedDiffText]);

  // 3. CASE CONVERTERS
  useEffect(() => {
    if (!caseInText) {
      setCaseOutText('');
      return;
    }
    // Default to preserving text till conversion explicitly selected
  }, [caseInText]);

  const convertCase = (mode: 'upper' | 'lower' | 'title' | 'camel' | 'snake' | 'kebab' | 'pascal' | 'sentence' | 'invert') => {
    if (!caseInText) return;
    
    let res = '';
    switch (mode) {
      case 'upper':
        res = caseInText.toUpperCase();
        break;
      case 'lower':
        res = caseInText.toLowerCase();
        break;
      case 'title':
        res = caseInText.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
        break;
      case 'camel':
        res = caseInText.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
        break;
      case 'snake':
        res = caseInText.toLowerCase().replace(/[\s\W]+/g, '_').trim();
        break;
      case 'kebab':
        res = caseInText.toLowerCase().replace(/[\s\W]+/g, '-').trim();
        break;
      case 'pascal':
        res = caseInText.replace(/(\w)(\w*)/g, (g0, g1, g2) => g1.toUpperCase() + g2.toLowerCase()).replace(/[\s\W]/g, '');
        break;
      case 'sentence':
        res = caseInText.charAt(0).toUpperCase() + caseInText.slice(1).toLowerCase();
        break;
      case 'invert':
        res = caseInText.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('');
        break;
      default:
        res = caseInText;
    }
    setCaseOutText(res);
  };

  // 4. WORD & WORD FREQUENCY COUNTERS
  useEffect(() => {
    const text = counterText || '';
    const charsWithSpaces = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    
    const wordsArr = text.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const words = wordsArr.length;
    const lines = text.split('\n').filter(Boolean).length;
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
    
    const avgLen = words > 0 ? (wordsArr.reduce((sum, w) => sum + w.length, 0) / words).toFixed(1) : '0.0';
    
    // Most frequent word compute
    const counts: { [key: string]: number } = {};
    const stopsList = ['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'to', 'in', 'of', 'for', 'it', 'with', 'by', 'that', 'this'];
    wordsArr.forEach(w => {
      const cleaned = w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
      if (cleaned && !stopsList.includes(cleaned)) {
        counts[cleaned] = (counts[cleaned] || 0) + 1;
      }
    });
    
    const sortedWords = Object.keys(counts)
      .map(k => ({ word: k, count: counts[k] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setCountStats({
      charsWithSpaces,
      charsNoSpaces,
      words,
      lines,
      sentences,
      avgWordLength: avgLen,
      topWords: sortedWords
    });
  }, [counterText]);

  // 5. UUID GENERATOR
  const executeGenerateUUID = () => {
    const uuids: string[] = [];
    const hexChars = '0123456789abcdef';
    
    for (let c = 0; c < uuidCount; c++) {
      let segment = '';
      for (let i = 0; i < 36; i++) {
        if (i === 8 || i === 13 || i === 18 || i === 23) {
          segment += uuidHyphens ? '-' : '';
        } else if (i === 14) {
          segment += '4'; // UUID v4
        } else if (i === 19) {
          segment += hexChars[(Math.floor(Math.random() * 4) + 8)]; // v4 variations: 8, 9, a, b
        } else {
          segment += hexChars[Math.floor(Math.random() * 16)];
        }
      }
      
      const out = uuidUpper ? segment.toUpperCase() : segment.toLowerCase();
      uuids.push(out);
    }
    setUuidList(uuids);
  };

  useEffect(() => {
    executeGenerateUUID();
  }, [uuidCount, uuidUpper, uuidHyphens]);

  // 6. LOREM IPSUM GENERATOR
  const executeGenerateLorem = () => {
    let result = '';
    const wordCount = LOREM_WORDS.length;
    
    const makeSentence = () => {
      const len = Math.floor(Math.random() * 10) + 8; // 8 to 17 words
      const sentWords: string[] = [];
      for (let i = 0; i < len; i++) {
        sentWords.push(LOREM_WORDS[Math.floor(Math.random() * wordCount)]);
      }
      const raw = sentWords.join(' ');
      return raw.charAt(0).toUpperCase() + raw.slice(1) + '.';
    };

    const makeParagraph = () => {
      const sents: string[] = [];
      const len = Math.floor(Math.random() * 4) + 3; // 3 to 6 sentences
      for (let i = 0; i < len; i++) {
        sents.push(makeSentence());
      }
      return sents.join(' ');
    };

    if (loremType === 'words') {
      const list: string[] = [];
      for (let i = 0; i < loremCount; i++) {
        list.push(LOREM_WORDS[Math.floor(Math.random() * wordCount)]);
      }
      result = list.join(' ');
    } else if (loremType === 'sentences') {
      const sents: string[] = [];
      for (let i = 0; i < loremCount; i++) {
        sents.push(makeSentence());
      }
      result = sents.join(' ');
    } else {
      const paras: string[] = [];
      for (let i = 0; i < loremCount; i++) {
        paras.push(makeParagraph());
      }
      result = paras.join('\n\n');
    }
    
    setLoremResult(result);
  };

  useEffect(() => {
    executeGenerateLorem();
  }, [loremCount, loremType]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-2xl backdrop-blur-xl space-y-6 text-xs leading-normal">
      
      {/* 1. REGEX BOX */}
      {subTab === 'regex' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-300">RegExp Matching Config</h4>
              <p className="text-[11px] text-slate-500 font-sans">Apply regular expressions to extract character sequences instantly.</p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Regex Pattern representation</label>
                <div className="flex bg-slate-950/40 border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-teal-500/20 font-mono">
                  <span className="text-slate-600 self-center">/</span>
                  <input
                    type="text"
                    value={regexPattern}
                    onChange={(e) => setRegexPattern(e.target.value)}
                    placeholder="[a-z0-9]+"
                    className="flex-grow bg-transparent border-none text-teal-300 px-1 font-mono text-xs outline-none"
                  />
                  <span className="text-slate-600 self-center">/</span>
                  <input
                    type="text"
                    value={regexFlags}
                    onChange={(e) => setRegexFlags(e.target.value)}
                    placeholder="g"
                    className="w-12 bg-transparent text-amber-400 font-mono text-xs text-center border-l border-white/10 ml-2 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-[11px]">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200">
                  <input
                    type="checkbox"
                    checked={regexFlags.includes('g')}
                    onChange={(e) => setRegexFlags(e.target.checked ? regexFlags + 'g' : regexFlags.replace('g', ''))}
                    className="rounded border-white/10 bg-white/5"
                  />
                  Global [g]
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200">
                  <input
                    type="checkbox"
                    checked={regexFlags.includes('i')}
                    onChange={(e) => setRegexFlags(e.target.checked ? regexFlags + 'i' : regexFlags.replace('i', ''))}
                    className="rounded border-white/10 bg-white/5"
                  />
                  Ignore Case [i]
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200">
                  <input
                    type="checkbox"
                    checked={regexFlags.includes('m')}
                    onChange={(e) => setRegexFlags(e.target.checked ? regexFlags + 'm' : regexFlags.replace('m', ''))}
                    className="rounded border-white/10 bg-white/5"
                  />
                  Multiline [m]
                </label>
              </div>
            </div>

            {regexError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-[11px] font-mono leading-relaxed">
                {regexError}
              </div>
            )}

            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 block tracking-wider font-mono">Matches count: {regexMatches.length}</span>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2">
                {regexMatches.length > 0 ? (
                  regexMatches.map((m, idx) => (
                    <div key={idx} className="p-2 bg-[#0a0f1d]/60 border border-white/5 rounded-lg flex justify-between font-mono text-[10px]">
                      <span className="text-teal-400 font-extrabold break-all">"{m.value}"</span>
                      <span className="text-slate-600 shrink-0 select-none">idx: {m.index}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-600">No match indices registered inside payload targets.</p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Test input target text</span>
            <textarea
              rows={11}
              value={regexText}
              onChange={(e) => setRegexText(e.target.value)}
              placeholder="Paste text contents to evaluate matches..."
              className="w-full bg-slate-950/40 border border-white/10 rounded-xl p-3 text-slate-200 text-xs font-mono placeholder-slate-700 outline-none resize-none h-[calc(100%-25px)] focus:border-teal-500/20"
            />
          </div>
        </div>
      )}

      {/* 2. CRYPTIC DIFF LCS ENGINE */}
      {subTab === 'diff' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-3 gap-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                <Diff className="text-teal-400" size={17} />
                LCS Line Diff Checker
              </h4>
              <p className="text-[11px] text-slate-500 font-sans">Side by side sequence alignment using traditional dynamic programming LCS algorithm.</p>
            </div>
            <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5 self-start md:self-auto">
              <button
                onClick={() => setDiffViewMode('inline')}
                className={`py-1 px-3 text-[10px] cursor-pointer rounded font-bold ${diffViewMode === 'inline' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Combined View
              </button>
              <button
                onClick={() => setDiffViewMode('split')}
                className={`py-1 px-3 text-[10px] cursor-pointer rounded font-bold ${diffViewMode === 'split' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Side-by-Side (Split)
              </button>
            </div>
          </div>

          {/* Sourced fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Original Source Text (A)</label>
              <textarea
                rows={5}
                value={originalDiffText}
                onChange={(e) => setOriginalDiffText(e.target.value)}
                placeholder="Enter original baseline text blocks..."
                className="w-full bg-slate-950/40 border border-white/10 rounded-xl p-3 text-slate-200 text-[11px] font-mono placeholder-slate-700 outline-none resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Modified Text block (B)</label>
              <textarea
                rows={5}
                value={modifiedDiffText}
                onChange={(e) => setModifiedDiffText(e.target.value)}
                placeholder="Enter modifications to evaluate alignment deviations..."
                className="w-full bg-slate-950/40 border border-white/10 rounded-xl p-3 text-slate-200 text-[11px] font-mono placeholder-slate-700 outline-none resize-none"
              />
            </div>
          </div>

          {/* Outcome block display */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Diff Alignment Analysis output</span>
            
            {diffViewMode === 'inline' ? (
              <div className="w-full p-4 bg-slate-950/60 border border-white/10 rounded-xl font-mono text-[11px] max-h-72 overflow-y-auto leading-relaxed divide-y divide-white/5">
                {diffResult.map((line, idx) => (
                  <div
                    key={idx}
                    className={`py-1 px-2.5 block ${
                      line.type === 'added' 
                        ? 'bg-emerald-500/10 border-l-2 border-emerald-500 text-emerald-300 font-semibold' 
                        : line.type === 'removed' 
                        ? 'bg-rose-500/10 border-l-2 border-rose-500 text-rose-300 line-through' 
                        : 'text-slate-400'
                    }`}
                  >
                    <span className="w-5 inline-block select-none font-sans text-[10px] text-slate-600">
                      {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                    </span>
                    {line.value || '\u00A0'}
                  </div>
                ))}
              </div>
            ) : (
              // Split diff columns side-by-side
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left col - baseline */}
                <div className="bg-slate-950/60 border border-white/10 rounded-xl p-3 max-h-72 overflow-y-auto leading-relaxed font-mono text-[10px] space-y-0.5">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase mb-1">Baseline A (With Removed Highlights)</span>
                  {diffResult.filter(l => l.type !== 'added').map((line, idx) => (
                    <div
                      key={idx}
                      className={`py-0.5 px-2 rounded ${
                        line.type === 'removed' ? 'bg-rose-500/10 text-rose-300 font-semibold line-through' : 'text-slate-400'
                      }`}
                    >
                      {line.value || '\u00A0'}
                    </div>
                  ))}
                </div>

                {/* Right col - modified */}
                <div className="bg-slate-950/60 border border-white/10 rounded-xl p-3 max-h-72 overflow-y-auto leading-relaxed font-mono text-[10px] space-y-0.5">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase mb-1">Result B (With Added Highlights)</span>
                  {diffResult.filter(l => l.type !== 'removed').map((line, idx) => (
                    <div
                      key={idx}
                      className={`py-0.5 px-2 rounded ${
                        line.type === 'added' ? 'bg-emerald-500/10 text-emerald-300 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      {line.value || '\u00A0'}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. CASE CONVERTER BOX */}
      {subTab === 'case' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-300">Case Formatting Conversions</h4>
            <p className="text-[11px] text-slate-500 font-sans">Convert multi-word parameters, identifier structures, or titles using clean typography rules.</p>
            
            <textarea
              rows={6}
              value={caseInText}
              onChange={(e) => setCaseInText(e.target.value)}
              placeholder="Enter standard human phrases to convert casing formats..."
              className="w-full bg-slate-950/40 border border-white/10 rounded-xl p-3 text-slate-200 font-sans text-xs placeholder-slate-700 outline-none resize-none"
            />

            {/* Quick converter layouts */}
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              {[
                { id: 'upper', label: 'UPPER CASE' },
                { id: 'lower', label: 'lower case' },
                { id: 'title', label: 'Title Case' },
                { id: 'camel', label: 'camelCase' },
                { id: 'snake', label: 'snake_case' },
                { id: 'kebab', label: 'kebab-case' },
                { id: 'pascal', label: 'PascalCase' },
                { id: 'sentence', label: 'Sentence case' },
                { id: 'invert', label: 'iNvErT cAsE' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => convertCase(opt.id as any)}
                  className="py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-300 hover:text-white rounded-lg font-mono font-bold transition active:scale-95 cursor-pointer"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Conversion Outcome</span>
              <textarea
                rows={9}
                readOnly
                value={caseOutText}
                placeholder="Click one of the case conversion triggers on the left..."
                className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-3 text-teal-300 text-xs font-mono placeholder-slate-700 outline-none resize-none"
              />
            </div>

            <button
              onClick={() => onCopy(caseOutText, 'caseOutput')}
              disabled={!caseOutText}
              className="w-full py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 hover:text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              {copiedId === 'caseOutput' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              Copy String Block
            </button>
          </div>
        </div>
      )}

      {/* 4. WORD COUNTER BOX */}
      {subTab === 'counter' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 leading-relaxed">
          <div className="lg:col-span-7 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Character Input Block</span>
            <textarea
              rows={11}
              value={counterText}
              onChange={(e) => setCounterText(e.target.value)}
              placeholder="Paste words or passages here..."
              className="w-full bg-slate-950/40 border border-white/10 rounded-xl p-3 text-slate-200 text-xs font-sans placeholder-slate-700 outline-none resize-none h-[calc(100%-25px)] focus:border-teal-500/20"
            />
          </div>

          <div className="lg:col-span-5 space-y-4">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
              <BarChart2 className="text-teal-400" size={17} />
              Real-time Text Metrics
            </h4>

            {/* Quick Metrics display grids */}
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-center">
                <h5 className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Characters (Total)</h5>
                <p className="text-lg font-bold text-teal-300 mt-1">{countStats.charsWithSpaces}</p>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-center">
                <h5 className="text-[9px] text-slate-500 uppercase tracking-wider font-bold font-mono">Words</h5>
                <p className="text-lg font-bold text-teal-300 mt-1">{countStats.words}</p>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-center">
                <h5 className="text-[9px] text-slate-500 uppercase tracking-wider font-bold font-mono">Sentences</h5>
                <p className="text-lg font-bold text-cyan-300 mt-1">{countStats.sentences}</p>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-center">
                <h5 className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Line breaks</h5>
                <p className="text-lg font-bold text-cyan-300 mt-1">{countStats.lines}</p>
              </div>
            </div>

            <div className="p-3 bg-white/5 border border-white/10 rounded-xl font-mono text-[10px] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Average Word Length:</span>
                <span className="text-slate-200 font-bold">{countStats.avgWordLength} chars</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estimated Reading time:</span>
                <span className="text-slate-200 font-bold">
                  {Math.ceil(countStats.words / 200)} min (~200 wpm)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Characters (Excl. spaces):</span>
                <span className="text-slate-200 font-bold">{countStats.charsNoSpaces} symbols</span>
              </div>
            </div>

            <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-slate-400 block font-mono uppercase tracking-wider">Top word frequencies (Excl. stops)</span>
              {countStats.topWords.length > 0 ? (
                <div className="space-y-1">
                  {countStats.topWords.map((item, idx) => (
                    <div key={idx} className="flex justify-between font-mono text-[10px]">
                      <span className="text-teal-400 font-semibold">"{item.word}"</span>
                      <span className="text-slate-400">{item.count} occurrences</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-600 font-mono">Insufficient character sequence to calculate indices.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. UUID GENERATOR */}
      {subTab === 'uuid' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 leading-relaxed">
          <div className="lg:col-span-5 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-300">Entropy UUID Generator</h4>
              <p className="text-[11px] text-slate-500 font-sans">Generate RFC-4122 Standard Version 4 (Random) high-eccentricity UUID blocks.</p>
            </div>

            <div className="space-y-3.5 pt-2 font-sans text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Quantity of Keys</label>
                <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5">
                  {[1, 5, 10, 25].map(q => (
                    <button
                      key={q}
                      onClick={() => setUuidCount(q)}
                      className={`flex-1 py-1 rounded cursor-pointer text-center text-[10px] font-bold ${uuidCount === q ? 'bg-teal-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-1 font-semibold">
                <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                  <input
                    type="checkbox"
                    checked={uuidUpper}
                    onChange={(e) => setUuidUpper(e.target.checked)}
                    className="rounded border-white/10 bg-white/5 text-teal-400"
                  />
                  Uppercase representation characters (HEX)
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                  <input
                    type="checkbox"
                    checked={uuidHyphens}
                    onChange={(e) => setUuidHyphens(e.target.checked)}
                    className="rounded border-white/10 bg-white/5 text-teal-400"
                  />
                  Include separating dashes (Format blocks)
                </label>
              </div>

              <button
                onClick={executeGenerateUUID}
                className="w-full py-2 bg-teal-500 text-slate-950 hover:bg-teal-400 font-extrabold rounded-lg text-xs flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
              >
                <RefreshCw size={12} className="animate-spin-slow" />
                Generate New Keyblocks
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">UUID Generated blocks</span>
              <div className="p-3 bg-slate-950/60 border border-white/10 rounded-xl font-mono text-[11px] text-teal-300 max-h-56 overflow-y-auto leading-loose divide-y divide-white/5 select-all font-bold">
                {uuidList.map((uuid, idx) => (
                  <div key={idx} className="py-1 break-all cursor-pointer hover:bg-white/5 rounded px-2 transition-colors">
                    {uuid}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => onCopy(uuidList.join('\n'), 'uuidCopy')}
              className="w-full py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 hover:text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5"
            >
              {copiedId === 'uuidCopy' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              Copy All Generated UUID Keys
            </button>
          </div>
        </div>
      )}

      {/* 6. LOREM GENERATOR */}
      {subTab === 'lorem' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 leading-relaxed">
          <div className="lg:col-span-4 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-300">Lorem Cicero Dummy text</h4>
              <p className="text-[11px] text-slate-500 font-sans">Generate clean dummy text to populate prototypes without unconstructive noise.</p>
            </div>

            <div className="space-y-3 pt-2 font-sans text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Output type</label>
                <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5">
                  {[
                    { id: 'paragraphs', label: 'Paragraphs' },
                    { id: 'sentences', label: 'Sentences' },
                    { id: 'words', label: 'Words' }
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setLoremType(item.id as any)}
                      className={`flex-1 py-1 rounded cursor-pointer text-center text-[10px] ${loremType === item.id ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Amount Count</label>
                <input
                  type="number"
                  min={1}
                  max={250}
                  value={loremCount}
                  onChange={(e) => setLoremCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-lg px-3 py-1.5 font-mono text-xs text-teal-300 focus:border-teal-500/20 outline-none"
                />
              </div>

              <button
                onClick={executeGenerateLorem}
                className="w-full py-2 bg-teal-500 text-slate-950 hover:bg-teal-400 font-extrabold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer pt-2"
              >
                Refresh Paragraph Blocks
              </button>
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Lorem Text outcomes</span>
              <textarea
                rows={8}
                readOnly
                value={loremResult}
                className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-3 text-slate-300 text-xs font-sans placeholder-slate-700 outline-none resize-none leading-relaxed"
              />
            </div>

            <button
              onClick={() => onCopy(loremResult, 'loremCopy')}
              disabled={!loremResult}
              className="w-full py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 hover:text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              {copiedId === 'loremCopy' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              Copy Lorem Ipsum Dummy Stream
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// -------------------------------------------------------------
// Component 3: CHRONOS & BASES UTILITY (Epoch, Base Converter, Unit Converter)
// -------------------------------------------------------------
interface TimeConvSectionProps {
  subTab: TimeConvUtilityType;
  copiedId: string | null;
  onCopy: (val: string, id?: string) => void;
}

function TimeConvSectionComponent({ subTab, copiedId, onCopy }: TimeConvSectionProps) {
  // Epoch states
  const [currentEpoch, setCurrentEpoch] = useState<number>(Math.floor(Date.now() / 1000));
  const [isEpochTicking, setIsEpochTicking] = useState(true);

  const [epochInput, setEpochInput] = useState(Math.floor(Date.now() / 1000).toString());
  const [epochResultLocal, setEpochResultLocal] = useState('');
  const [epochResultUTC, setEpochResultUTC] = useState('');
  const [epochResultISO, setEpochResultISO] = useState('');
  const [epochResultRelative, setEpochResultRelative] = useState('');

  const [dateInputString, setDateInputString] = useState(new Date().toISOString());
  const [convDateToSeconds, setConvDateToSeconds] = useState('');
  const [convDateToMs, setConvDateToMs] = useState('');

  // Base Converter states
  const [baseBin, setBaseBin] = useState('1101');
  const [baseOct, setBaseOct] = useState('15');
  const [baseDec, setBaseDec] = useState('13');
  const [baseHex, setBaseHex] = useState('d');
  const [baseError, setBaseError] = useState('');

  // Unit Converter states
  const [unitCategory, setUnitCategory] = useState<'data' | 'distance' | 'weight' | 'temp'>('data');
  const [unitFrom, setUnitFrom] = useState('MB');
  const [unitTo, setUnitTo] = useState('GB');
  const [unitValue, setUnitValue] = useState<number>(1024);
  const [unitResult, setUnitResult] = useState<string>('1');

  // 1. Live Epoch ticker
  useEffect(() => {
    if (!isEpochTicking) return;
    const interval = setInterval(() => {
      setCurrentEpoch(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isEpochTicking]);

  // Conv Epoch string to humans
  useEffect(() => {
    if (!epochInput) {
      setEpochResultLocal('');
      setEpochResultUTC('');
      setEpochResultISO('');
      setEpochResultRelative('');
      return;
    }
    try {
      const num = Number(epochInput.trim());
      if (isNaN(num)) throw new Error('Unregistered parameters.');
      
      // Determine if milliseconds or seconds
      // Millisecond epochs usually contain 13 structures, whereas standard epochs contain 10
      const ms = num.toString().length >= 13 ? num : num * 1000;
      const d = new Date(ms);
      
      if (isNaN(d.getTime())) throw new Error();
      
      setEpochResultLocal(d.toLocaleString());
      setEpochResultUTC(d.toUTCString());
      setEpochResultISO(d.toISOString());
      
      // Relative epoch text formulation
      const diffSec = Math.floor((Date.now() - ms) / 1000);
      const absDiff = Math.abs(diffSec);
      let relStr = '';
      if (absDiff < 60) relStr = `${absDiff} seconds`;
      else if (absDiff < 3600) relStr = `${Math.floor(absDiff / 60)} minutes`;
      else if (absDiff < 86400) relStr = `${Math.floor(absDiff / 3600)} hours`;
      else relStr = `${Math.floor(absDiff / 86400)} days`;
      
      setEpochResultRelative(diffSec >= 0 ? `${relStr} ago` : `in ${relStr}`);
    } catch {
      setEpochResultLocal('Invalid Epoch Input');
      setEpochResultUTC('Invalid Epoch Input');
      setEpochResultISO('Invalid Epoch Input');
      setEpochResultRelative('Invalid Epoch Input');
    }
  }, [epochInput]);

  // Date parsing to Epoch
  useEffect(() => {
    if (!dateInputString) return;
    try {
      const d = new Date(dateInputString.trim());
      if (!isNaN(d.getTime())) {
        setConvDateToSeconds(Math.floor(d.getTime() / 1000).toString());
        setConvDateToMs(d.getTime().toString());
      } else {
        setConvDateToSeconds('Parsing Error');
        setConvDateToMs('Parsing Error');
      }
    } catch {
      setConvDateToSeconds('Parsing Error');
      setConvDateToMs('Parsing Error');
    }
  }, [dateInputString]);

  // 2. Dual numeric base synchronization
  const syncBases = (val: string, fromBase: 2 | 8 | 10 | 16) => {
    setBaseError('');
    const cleaned = val.trim();
    if (!cleaned) {
      setBaseBin('');
      setBaseOct('');
      setBaseDec('');
      setBaseHex('');
      return;
    }

    try {
      // Validate string matching native limits
      let num = 0;
      if (fromBase === 2) {
        if (!/^[01]+$/.test(cleaned)) throw new Error('Binary accepts values "0" and "1" only.');
        num = parseInt(cleaned, 2);
        setBaseBin(cleaned);
        setBaseOct(num.toString(8));
        setBaseDec(num.toString(10));
        setBaseHex(num.toString(16));
      } else if (fromBase === 8) {
        if (!/^[0-7]+$/.test(cleaned)) throw new Error('Octal accepts value registers from "0" to "7" only.');
        num = parseInt(cleaned, 8);
        setBaseBin(num.toString(2));
        setBaseOct(cleaned);
        setBaseDec(num.toString(10));
        setBaseHex(num.toString(16));
      } else if (fromBase === 10) {
        if (!/^[0-9]+$/.test(cleaned)) throw new Error('Decimal accepts integers from "0" through "9".');
        num = parseInt(cleaned, 10);
        setBaseBin(num.toString(2));
        setBaseOct(num.toString(8));
        setBaseDec(cleaned);
        setBaseHex(num.toString(16));
      } else if (fromBase === 16) {
        if (!/^[0-9a-fA-F]+$/.test(cleaned)) throw new Error('Hexadecimal accepts characters "0-9" and "a-f" only.');
        num = parseInt(cleaned, 16);
        setBaseBin(num.toString(2));
        setBaseOct(num.toString(8));
        setBaseDec(num.toString(10));
        setBaseHex(cleaned.toLowerCase());
      }
    } catch (err: any) {
      setBaseError(err.message || 'Error processing base formatting limits.');
    }
  };

  // Convert categories configuration setup
  const unitsMap: { [key: string]: { [unit: string]: number } } = {
    data: {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024
    },
    distance: {
      'm': 1,
      'km': 1000,
      'miles': 1609.344,
      'feet': 0.3048,
      'inches': 0.0254
    },
    weight: {
      'g': 1,
      'kg': 1000,
      'lbs': 453.59237,
      'oz': 28.3495231
    }
  };

  useEffect(() => {
    // Sync default subunits when category morphs
    if (unitCategory === 'data') {
      setUnitFrom('MB');
      setUnitTo('GB');
    } else if (unitCategory === 'distance') {
      setUnitFrom('km');
      setUnitTo('miles');
    } else if (unitCategory === 'weight') {
      setUnitFrom('kg');
      setUnitTo('lbs');
    } else {
      setUnitFrom('C');
      setUnitTo('F');
    }
  }, [unitCategory]);

  // Compute sub-conversions
  useEffect(() => {
    const val = Number(unitValue);
    if (isNaN(val)) {
      setUnitResult('Invalid number');
      return;
    }

    if (unitCategory === 'temp') {
      let cVal = val;
      if (unitFrom === 'F') cVal = (val - 32) * 5/9;
      else if (unitFrom === 'K') cVal = val - 273.15;

      let targetVal = cVal;
      if (unitTo === 'F') targetVal = (cVal * 9/5) + 32;
      else if (unitTo === 'K') targetVal = cVal + 273.15;
      
      setUnitResult(targetVal.toFixed(4).replace(/\.?0+$/, ''));
    } else {
      const catMap = unitsMap[unitCategory];
      if (catMap && catMap[unitFrom] && catMap[unitTo]) {
        const baseAmount = val * catMap[unitFrom];
        const targetAmount = baseAmount / catMap[unitTo];
        setUnitResult(targetAmount.toFixed(6).replace(/\.?0+$/, ''));
      }
    }
  }, [unitCategory, unitFrom, unitTo, unitValue]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-2xl backdrop-blur-xl text-xs space-y-6 leading-relaxed">
      
      {/* 1. CHRONOS TIME INTERFACES */}
      {subTab === 'epoch' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
          {/* Live Chronos banner */}
          <div className="lg:col-span-4 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Clock className="text-teal-400 animate-spin-slow" size={17} />
                Ticking Chronos Core
              </h4>
              <p className="text-[11px] text-slate-500">Local processor ticks UTC timestamps in live sync.</p>
            </div>

            <div className="p-4 bg-slate-950/40 border border-white/10 rounded-2xl text-center font-mono space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-widest">Active Unix Epoch</span>
              <p className="text-xl font-black tracking-tight text-teal-300">{currentEpoch}</p>
              
              <div className="flex justify-center gap-2 text-[10px] pt-1">
                <button
                  onClick={() => setIsEpochTicking(!isEpochTicking)}
                  className={`px-3 py-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded-md font-bold transition flex items-center gap-1 cursor-pointer`}
                >
                  {isEpochTicking ? <Pause size={10} /> : <Play size={10} />}
                  {isEpochTicking ? 'Freeze' : 'Resume'}
                </button>
                <button
                  onClick={() => onCopy(currentEpoch.toString(), 'liveTime')}
                  className="px-3 py-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded-md font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === 'liveTime' ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                  Copy Epoch
                </button>
              </div>
            </div>

            {/* Quick inject converter click */}
            <button
              onClick={() => setEpochInput(currentEpoch.toString())}
              className="w-full py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-mono tracking-wider font-bold text-slate-400 cursor-pointer"
            >
              ← Inject ticking epoch into translator
            </button>
          </div>

          {/* Sinks date string converter */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 leading-normal divide-y md:divide-y-0 md:divide-x divide-white/10">
            {/* Convert Epoch to human date */}
            <div className="space-y-4">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block font-mono">Epoch Code ↔ Human DateTime</span>
              
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 block font-mono uppercase font-bold">Input Epoch seconds / ms</label>
                <input
                  type="text"
                  value={epochInput}
                  onChange={(e) => setEpochInput(e.target.value)}
                  placeholder="e.g. 1775640000"
                  className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2 font-mono text-xs text-teal-300 focus:border-teal-500/20 outline-none"
                />
              </div>

              <div className="p-3 bg-[#0a0f1d]/50 border border-white/5 rounded-2xl font-mono text-[10px] space-y-2 leading-relaxed">
                <div>
                  <span className="text-slate-500 block">Relative distance:</span>
                  <span className="text-teal-300 font-bold">{epochResultRelative}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Local Date string:</span>
                  <span className="text-slate-200 font-bold">{epochResultLocal}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">UTC Time zone:</span>
                  <span className="text-slate-200 font-bold">{epochResultUTC}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">ISO Standard notation:</span>
                  <span className="text-cyan-400 font-bold max-w-full break-all inline-block">{epochResultISO}</span>
                </div>
              </div>
            </div>

            {/* Convert date string to Epoch seconds */}
            <div className="space-y-4 pt-4 md:pt-0 md:pl-6">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block font-mono">Date String ↔ Epoch Code</span>
              
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 block font-mono uppercase font-bold">Input Date standard string</label>
                <input
                  type="text"
                  value={dateInputString}
                  onChange={(e) => setDateInputString(e.target.value)}
                  placeholder={new Date().toISOString()}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-3 py-2 font-mono text-xs text-teal-300 focus:border-teal-500/20 outline-none"
                />
              </div>

              <div className="p-3 bg-[#0a0f1d]/50 border border-white/5 rounded-2xl font-mono text-[10px] space-y-3 leading-relaxed">
                <div>
                  <span className="text-slate-500 block uppercase text-[8px] tracking-wide font-bold">Epoch seconds relative value:</span>
                  <div className="flex justify-between items-center bg-white/5 p-1 px-2 rounded border border-white/5 mt-0.5">
                    <span className="text-teal-300 font-bold select-all">{convDateToSeconds}</span>
                    <button onClick={() => onCopy(convDateToSeconds, 'c1')} className="text-slate-500 hover:text-white"><Copy size={10} /></button>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[8px] tracking-wide font-bold">Epoch Milliseconds absolute value:</span>
                  <div className="flex justify-between items-center bg-white/5 p-1 px-2 rounded border border-white/5 mt-0.5">
                    <span className="text-cyan-300 font-bold select-all">{convDateToMs}</span>
                    <button onClick={() => onCopy(convDateToMs, 'c2')} className="text-slate-500 hover:text-white"><Copy size={10} /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. BASE CONVERTERS (Bin, Oct, Dec, Hex) */}
      {subTab === 'base_conv' && (
        <div className="space-y-5 leading-normal">
          <div className="border-b border-white/10 pb-2 flex justify-between items-center">
            <div>
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                <Binary className="text-teal-400" size={17} />
                Synchronous Bases Converter
              </h4>
              <p className="text-[11px] text-slate-500 font-sans">Updating any of the integers automatically translates representation states in real-time.</p>
            </div>
            {baseError && <span className="text-[10px] text-rose-400 font-mono font-bold">{baseError}</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
            {/* Binary Input */}
            <div className="bg-slate-950/40 p-3.5 border border-white/10 rounded-2xl space-y-1.5 focus-within:border-teal-500/20">
              <span className="text-[10px] font-bold text-slate-500 block tracking-widest font-mono uppercase">Binary Subunit (Base 2)</span>
              <input
                type="text"
                value={baseBin}
                onChange={(e) => syncBases(e.target.value, 2)}
                placeholder="0101"
                className="w-full bg-transparent text-teal-300 font-bold border-none outline-none overflow-x-auto break-all pb-1 select-all"
              />
            </div>

            {/* Octal Input */}
            <div className="bg-slate-950/40 p-3.5 border border-white/10 rounded-2xl space-y-1.5 focus-within:border-teal-500/20">
              <span className="text-[10px] font-bold text-slate-500 block tracking-widest font-mono uppercase">Octal Subunit (Base 8)</span>
              <input
                type="text"
                value={baseOct}
                onChange={(e) => syncBases(e.target.value, 8)}
                placeholder="0-7"
                className="w-full bg-transparent text-cyan-300 font-bold border-none outline-none select-all"
              />
            </div>

            {/* Decimal Input */}
            <div className="bg-slate-950/40 p-3.5 border border-white/10 rounded-2xl space-y-1.5 focus-within:border-teal-500/20">
              <span className="text-[10px] font-bold text-slate-500 block tracking-widest font-mono uppercase">Decimal integer (Base 10)</span>
              <input
                type="text"
                value={baseDec}
                onChange={(e) => syncBases(e.target.value, 10)}
                placeholder="0-9"
                className="w-full bg-transparent text-slate-200 font-bold border-none outline-none select-all"
              />
            </div>

            {/* Hex Input */}
            <div className="bg-slate-950/40 p-3.5 border border-white/10 rounded-2xl space-y-1.5 focus-within:border-teal-500/20">
              <span className="text-[10px] font-bold text-slate-500 block tracking-widest font-mono uppercase">Hexadecimal byte (Base 16)</span>
              <input
                type="text"
                value={baseHex}
                onChange={(e) => syncBases(e.target.value, 16)}
                placeholder="0-f"
                className="w-full bg-transparent text-amber-300 font-bold border-none outline-none uppercase select-all"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. UNIT CONVERTERS */}
      {subTab === 'unit_conv' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 leading-relaxed">
          <div className="lg:col-span-4 space-y-4 font-sans text-xs">
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-1">General Units Converter</h4>
              <p className="text-[11px] text-slate-500">Fast ratios compute across multi categories.</p>
            </div>

            {/* Selector column */}
            <div className="space-y-2.5">
              <label className="text-[9px] text-slate-500 font-mono tracking-wider uppercase block">Metric category</label>
              <div className="flex flex-col bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
                {[
                  { id: 'data', label: 'Data Storage (B, KB, MB, GB)' },
                  { id: 'distance', label: 'Distance & Length (m, km, miles)' },
                  { id: 'weight', label: 'Weights & Masses (g, kg, lbs)' },
                  { id: 'temp', label: 'Temperature Scale (C, F, K)' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setUnitCategory(opt.id as any)}
                    className={`text-left py-1.5 px-3 rounded-lg text-[10px] font-bold cursor-pointer transition ${unitCategory === opt.id ? 'bg-teal-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Units Form input columns */}
          <div className="lg:col-span-8 bg-slate-950/40 border border-white/10 rounded-2xl p-5 shadow-lg grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Left box: Insert source */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Baseline Input</label>
              <input
                type="number"
                value={unitValue}
                onChange={(e) => setUnitValue(parseFloat(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 font-mono text-slate-200 text-xs focus:border-teal-500/20 outline-none"
              />
              
              <select
                value={unitFrom}
                onChange={(e) => setUnitFrom(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 text-slate-300 font-semibold p-1 px-2.5 text-[11px] rounded-lg cursor-pointer max-h-48 overflow-y-auto"
              >
                {unitCategory === 'data' && ['B', 'KB', 'MB', 'GB', 'TB'].map(u => <option key={u} value={u}>{u}</option>)}
                {unitCategory === 'distance' && ['m', 'km', 'miles', 'feet', 'inches'].map(u => <option key={u} value={u}>{u}</option>)}
                {unitCategory === 'weight' && ['g', 'kg', 'lbs', 'oz'].map(u => <option key={u} value={u}>{u}</option>)}
                {unitCategory === 'temp' && ['C', 'F', 'K'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            {/* Middle decorative arrow */}
            <div className="text-center font-bold text-slate-600 hidden md:block">
              <div className="p-2 bg-white/5 rounded-full border border-white/5 w-10 h-10 flex items-center justify-center mx-auto text-teal-400 select-none">
                →
              </div>
            </div>

            {/* Right box: result output */}
            <div className="space-y-2 text-left">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Converted Outcome</label>
              <div className="w-full bg-[#0a0f1d]/50 border border-white/5 rounded-xl p-2.5 font-mono text-teal-300 text-xs select-all text-center md:text-left h-9 flex items-center">
                {unitResult}
              </div>

              <select
                value={unitTo}
                onChange={(e) => setUnitTo(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 text-slate-300 font-semibold p-1 px-2.5 text-[11px] rounded-lg cursor-pointer"
              >
                {unitCategory === 'data' && ['B', 'KB', 'MB', 'GB', 'TB'].map(u => <option key={u} value={u}>{u}</option>)}
                {unitCategory === 'distance' && ['m', 'km', 'miles', 'feet', 'inches'].map(u => <option key={u} value={u}>{u}</option>)}
                {unitCategory === 'weight' && ['g', 'kg', 'lbs', 'oz'].map(u => <option key={u} value={u}>{u}</option>)}
                {unitCategory === 'temp' && ['C', 'F', 'K'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
