import { Agent, AgentTask, AgentResponse } from './types';

export class MetadataExtractionAgent implements Agent {
  name = 'MetadataExtraction';
  description = 'Extracts and analyzes metadata from code files and content';
  capabilities = [
    'code_parsing',
    'structure_analysis',
    'dependency_extraction',
    'pattern_recognition',
    'semantic_tagging'
  ];

  async execute(task: AgentTask): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      switch (task.type) {
        case 'extract_metadata':
          return await this.extractMetadata(task.data);
        case 'analyze_structure':
          return await this.analyzeStructure(task.data);
        case 'extract_dependencies':
          return await this.extractDependencies(task.data);
        case 'identify_patterns':
          return await this.identifyPatterns(task.data);
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.message,
        metadata: {
          executionTime: Date.now() - startTime
        }
      };
    }
  }

  private async extractMetadata(data: { 
    content: string, 
    filename: string,
    fileType?: string 
  }): Promise<AgentResponse> {
    const { content, filename, fileType } = data;
    
    const detectedFileType = fileType || this.detectFileType(filename);
    const metadata = {
      filename,
      fileType: detectedFileType,
      size: content.length,
      lines: content.split('\n').length,
      ...this.extractLanguageSpecificMetadata(content, detectedFileType)
    };

    return {
      success: true,
      data: metadata,
      metadata: {
        confidence: this.assessExtractionConfidence(metadata),
        executionTime: Date.now() - Date.now()
      }
    };
  }

  private async analyzeStructure(data: { content: string, fileType: string }): Promise<AgentResponse> {
    const { content, fileType } = data;
    
    const structure = {
      hierarchy: this.extractHierarchy(content, fileType),
      complexity: this.calculateComplexity(content),
      patterns: this.identifyStructuralPatterns(content, fileType),
      relationships: this.extractRelationships(content, fileType)
    };

    return {
      success: true,
      data: structure,
      metadata: {
        confidence: 0.8,
        executionTime: Date.now() - Date.now()
      }
    };
  }

  private async extractDependencies(data: { content: string, fileType: string }): Promise<AgentResponse> {
    const { content, fileType } = data;
    
    const dependencies = {
      imports: this.extractImports(content, fileType),
      exports: this.extractExports(content, fileType),
      external: this.extractExternalDependencies(content, fileType),
      internal: this.extractInternalDependencies(content, fileType)
    };

    return {
      success: true,
      data: dependencies,
      metadata: {
        confidence: 0.85,
        executionTime: Date.now() - Date.now()
      }
    };
  }

  private async identifyPatterns(data: { content: string, fileType: string }): Promise<AgentResponse> {
    const { content, fileType } = data;
    
    const patterns = {
      designPatterns: this.identifyDesignPatterns(content),
      codingPatterns: this.identifyCodingPatterns(content, fileType),
      antiPatterns: this.identifyAntiPatterns(content, fileType),
      bestPractices: this.checkBestPractices(content, fileType)
    };

    return {
      success: true,
      data: patterns,
      metadata: {
        confidence: 0.75,
        executionTime: Date.now() - Date.now()
      }
    };
  }

  private detectFileType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    const typeMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript-react',
      'js': 'javascript',
      'jsx': 'javascript-react',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin',
      'md': 'markdown',
      'json': 'json',
      'xml': 'xml',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sql': 'sql',
      'yaml': 'yaml',
      'yml': 'yaml'
    };
    
    return typeMap[extension || ''] || 'text';
  }

  private extractLanguageSpecificMetadata(content: string, fileType: string): any {
    const baseMetadata = {
      functions: this.extractFunctions(content, fileType),
      classes: this.extractClasses(content, fileType),
      variables: this.extractVariables(content, fileType),
      comments: this.extractComments(content, fileType),
      keywords: this.extractKeywords(content, fileType),
      complexity: this.calculateComplexity(content)
    };

    switch (fileType) {
      case 'typescript':
      case 'typescript-react':
        return {
          ...baseMetadata,
          interfaces: this.extractTypeScriptInterfaces(content),
          types: this.extractTypeScriptTypes(content),
          decorators: this.extractDecorators(content),
          generics: this.extractGenerics(content)
        };
      
      case 'javascript':
      case 'javascript-react':
        return {
          ...baseMetadata,
          asyncFunctions: this.extractAsyncFunctions(content),
          promises: this.extractPromises(content),
          callbacks: this.extractCallbacks(content)
        };
      
      case 'python':
        return {
          ...baseMetadata,
          imports: this.extractPythonImports(content),
          decorators: this.extractPythonDecorators(content),
          docstrings: this.extractDocstrings(content)
        };
      
      default:
        return baseMetadata;
    }
  }

  private extractFunctions(content: string, fileType: string): any[] {
    const functions: any[] = [];
    
    // Different regex patterns for different languages
    const patterns: Record<string, RegExp[]> = {
      'typescript': [
        /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
        /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?\(/g,
        /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*\([^)]*\)\s*=>/g
      ],
      'javascript': [
        /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
        /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?\(/g
      ],
      'python': [
        /def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
        /async\s+def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g
      ]
    };

    const languagePatterns = patterns[fileType] || patterns['javascript'];
    
    languagePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        functions.push({
          name: match[1],
          line: this.getLineNumber(content, match.index),
          type: 'function'
        });
      }
    });

    return functions;
  }

  private extractClasses(content: string, fileType: string): any[] {
    const classes: any[] = [];
    
    const patterns: Record<string, RegExp[]> = {
      'typescript': [
        /(?:export\s+)?(?:abstract\s+)?class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
        /(?:export\s+)?interface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g
      ],
      'javascript': [
        /(?:export\s+)?class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g
      ],
      'python': [
        /class\s+([a-zA-Z_][a-zA-Z0-9_]*)/g
      ]
    };

    const languagePatterns = patterns[fileType] || patterns['javascript'];
    
    languagePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        classes.push({
          name: match[1],
          line: this.getLineNumber(content, match.index),
          type: 'class'
        });
      }
    });

    return classes;
  }

  private extractVariables(content: string, fileType: string): any[] {
    const variables: any[] = [];
    
    const patterns: Record<string, RegExp[]> = {
      'typescript': [
        /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
        /(?:export\s+)?(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g
      ],
      'javascript': [
        /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g
      ],
      'python': [
        /^([a-zA-Z_][a-zA-Z0-9_]*)\s*=/gm
      ]
    };

    const languagePatterns = patterns[fileType] || patterns['javascript'];
    
    languagePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        variables.push({
          name: match[1],
          line: this.getLineNumber(content, match.index),
          type: 'variable'
        });
      }
    });

    return variables.slice(0, 20); // Limit to avoid too many results
  }

  private extractComments(content: string, fileType: string): any[] {
    const comments: any[] = [];
    
    const patterns: Record<string, RegExp[]> = {
      'typescript': [
        /\/\*[\s\S]*?\*\//g,
        /\/\/.*$/gm
      ],
      'javascript': [
        /\/\*[\s\S]*?\*\//g,
        /\/\/.*$/gm
      ],
      'python': [
        /#.*$/gm,
        /"""[\s\S]*?"""/g,
        /'''[\s\S]*?'''/g
      ]
    };

    const languagePatterns = patterns[fileType] || patterns['javascript'];
    
    languagePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        comments.push({
          content: match[0],
          line: this.getLineNumber(content, match.index),
          type: match[0].startsWith('//') || match[0].startsWith('#') ? 'single' : 'multi'
        });
      }
    });

    return comments;
  }

  private extractKeywords(content: string, fileType: string): string[] {
    const keywords: Record<string, string[]> = {
      'typescript': ['async', 'await', 'interface', 'type', 'enum', 'namespace', 'module', 'declare'],
      'javascript': ['async', 'await', 'function', 'class', 'const', 'let', 'var', 'import', 'export'],
      'python': ['def', 'class', 'import', 'from', 'async', 'await', 'lambda', 'yield']
    };

    const languageKeywords = keywords[fileType] || keywords['javascript'];
    const foundKeywords: string[] = [];

    languageKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      if (regex.test(content)) {
        foundKeywords.push(keyword);
      }
    });

    return foundKeywords;
  }

  private extractTypeScriptInterfaces(content: string): any[] {
    const interfaces: any[] = [];
    const pattern = /interface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*{([^}]*)}/g;
    
    let match;
    while ((match = pattern.exec(content)) !== null) {
      interfaces.push({
        name: match[1],
        line: this.getLineNumber(content, match.index),
        properties: this.extractInterfaceProperties(match[2])
      });
    }

    return interfaces;
  }

  private extractInterfaceProperties(interfaceBody: string): string[] {
    const properties: string[] = [];
    const lines = interfaceBody.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*')) {
        const propMatch = trimmed.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[?:]?\s*:/);
        if (propMatch) {
          properties.push(propMatch[1]);
        }
      }
    });

    return properties;
  }

  private extractHierarchy(content: string, fileType: string): any {
    // Extract code hierarchy (classes, functions, etc.)
    const functions = this.extractFunctions(content, fileType);
    const classes = this.extractClasses(content, fileType);
    
    return {
      classes: classes.length,
      functions: functions.length,
      maxNestingLevel: this.calculateMaxNesting(content),
      structure: 'hierarchical'
    };
  }

  private calculateComplexity(content: string): number {
    // Simple complexity calculation based on various factors
    let complexity = 0;
    
    // Cyclomatic complexity indicators
    const complexityKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', 'try'];
    complexityKeywords.forEach(keyword => {
      const matches = content.match(new RegExp(`\\b${keyword}\\b`, 'g'));
      complexity += matches ? matches.length : 0;
    });
    
    // Normalize by lines of code
    const lines = content.split('\n').length;
    return Math.min(complexity / Math.max(lines / 10, 1), 10);
  }

  private calculateMaxNesting(content: string): number {
    let maxNesting = 0;
    let currentNesting = 0;
    
    for (const char of content) {
      if (char === '{') {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if (char === '}') {
        currentNesting--;
      }
    }
    
    return maxNesting;
  }

  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  private assessExtractionConfidence(metadata: any): number {
    let confidence = 0.5;
    
    // Increase confidence based on extracted elements
    if (metadata.functions?.length > 0) confidence += 0.1;
    if (metadata.classes?.length > 0) confidence += 0.1;
    if (metadata.comments?.length > 0) confidence += 0.1;
    if (metadata.keywords?.length > 0) confidence += 0.1;
    
    // File type specific confidence
    if (['typescript', 'javascript', 'python'].includes(metadata.fileType)) {
      confidence += 0.2;
    }
    
    return Math.min(confidence, 0.95);
  }

  // Additional helper methods for specific extractions
  private extractImports(content: string, fileType: string): string[] {
    const imports: string[] = [];
    const patterns: Record<string, RegExp[]> = {
      'typescript': [/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g],
      'javascript': [/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g],
      'python': [/from\s+([^\s]+)\s+import/g, /import\s+([^\s]+)/g]
    };

    const languagePatterns = patterns[fileType] || [];
    languagePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        imports.push(match[1]);
      }
    });

    return imports;
  }

  private extractExports(content: string, fileType: string): string[] {
    const exports: string[] = [];
    const patterns: Record<string, RegExp[]> = {
      'typescript': [/export\s+(?:default\s+)?(?:class|function|const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g],
      'javascript': [/export\s+(?:default\s+)?(?:class|function|const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g]
    };

    const languagePatterns = patterns[fileType] || [];
    languagePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        exports.push(match[1]);
      }
    });

    return exports;
  }

  private extractExternalDependencies(content: string, fileType: string): string[] {
    const external: string[] = [];
    const importPattern = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    
    let match;
    while ((match = importPattern.exec(content)) !== null) {
      const importPath = match[1];
      // External if it doesn't start with . or /
      if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
        external.push(importPath);
      }
    }

    return external;
  }

  private extractInternalDependencies(content: string, fileType: string): string[] {
    const internal: string[] = [];
    const importPattern = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    
    let match;
    while ((match = importPattern.exec(content)) !== null) {
      const importPath = match[1];
      // Internal if it starts with . or /
      if (importPath.startsWith('.') || importPath.startsWith('/')) {
        internal.push(importPath);
      }
    }

    return internal;
  }

  private identifyStructuralPatterns(content: string, fileType: string): string[] {
    const patterns: string[] = [];
    
    if (content.includes('class') && content.includes('extends')) {
      patterns.push('inheritance');
    }
    if (content.includes('interface') || content.includes('implements')) {
      patterns.push('interface_implementation');
    }
    if (content.includes('async') && content.includes('await')) {
      patterns.push('async_await');
    }
    if (content.includes('Promise')) {
      patterns.push('promises');
    }
    
    return patterns;
  }

  private extractRelationships(content: string, fileType: string): any {
    return {
      inheritance: content.includes('extends'),
      composition: content.includes('new '),
      aggregation: content.includes('this.'),
      dependency: this.extractImports(content, fileType).length > 0
    };
  }

  private identifyDesignPatterns(content: string): string[] {
    const patterns: string[] = [];
    
    if (content.includes('getInstance') || content.includes('singleton')) {
      patterns.push('singleton');
    }
    if (content.includes('factory') || content.includes('Factory')) {
      patterns.push('factory');
    }
    if (content.includes('observer') || content.includes('Observer')) {
      patterns.push('observer');
    }
    if (content.includes('strategy') || content.includes('Strategy')) {
      patterns.push('strategy');
    }
    
    return patterns;
  }

  private identifyCodingPatterns(content: string, fileType: string): string[] {
    const patterns: string[] = [];
    
    if (content.includes('try') && content.includes('catch')) {
      patterns.push('error_handling');
    }
    if (content.includes('map') || content.includes('filter') || content.includes('reduce')) {
      patterns.push('functional_programming');
    }
    if (content.includes('useState') || content.includes('useEffect')) {
      patterns.push('react_hooks');
    }
    
    return patterns;
  }

  private identifyAntiPatterns(content: string, fileType: string): string[] {
    const antiPatterns: string[] = [];
    
    if (content.includes('var ') && fileType.includes('javascript')) {
      antiPatterns.push('var_usage');
    }
    if (content.split('\n').some(line => line.length > 120)) {
      antiPatterns.push('long_lines');
    }
    if ((content.match(/function/g) || []).length > 20) {
      antiPatterns.push('too_many_functions');
    }
    
    return antiPatterns;
  }

  private checkBestPractices(content: string, fileType: string): string[] {
    const practices: string[] = [];
    
    if (content.includes('const ') || content.includes('let ')) {
      practices.push('modern_variable_declarations');
    }
    if (content.includes('// ') || content.includes('/* ')) {
      practices.push('code_comments');
    }
    if (content.includes('export') || content.includes('import')) {
      practices.push('modular_code');
    }
    
    return practices;
  }

  // Additional TypeScript specific methods
  private extractTypeScriptTypes(content: string): any[] {
    const types: any[] = [];
    const pattern = /type\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g;
    
    let match;
    while ((match = pattern.exec(content)) !== null) {
      types.push({
        name: match[1],
        line: this.getLineNumber(content, match.index)
      });
    }

    return types;
  }

  private extractDecorators(content: string): string[] {
    const decorators: string[] = [];
    const pattern = /@([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    
    let match;
    while ((match = pattern.exec(content)) !== null) {
      decorators.push(match[1]);
    }

    return [...new Set(decorators)];
  }

  private extractGenerics(content: string): string[] {
    const generics: string[] = [];
    const pattern = /<([A-Z][a-zA-Z0-9_$]*(?:\s*,\s*[A-Z][a-zA-Z0-9_$]*)*)>/g;
    
    let match;
    while ((match = pattern.exec(content)) !== null) {
      generics.push(match[1]);
    }

    return [...new Set(generics)];
  }

  private extractAsyncFunctions(content: string): any[] {
    const asyncFunctions: any[] = [];
    const pattern = /async\s+(?:function\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    
    let match;
    while ((match = pattern.exec(content)) !== null) {
      asyncFunctions.push({
        name: match[1],
        line: this.getLineNumber(content, match.index)
      });
    }

    return asyncFunctions;
  }

  private extractPromises(content: string): number {
    const promisePattern = /Promise\s*\./g;
    const matches = content.match(promisePattern);
    return matches ? matches.length : 0;
  }

  private extractCallbacks(content: string): number {
    const callbackPattern = /\(\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*\)\s*=>/g;
    const matches = content.match(callbackPattern);
    return matches ? matches.length : 0;
  }

  private extractPythonImports(content: string): string[] {
    const imports: string[] = [];
    const patterns = [
      /import\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
      /from\s+([a-zA-Z_][a-zA-Z0-9_.]*)\s+import/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        imports.push(match[1]);
      }
    });

    return [...new Set(imports)];
  }

  private extractPythonDecorators(content: string): string[] {
    const decorators: string[] = [];
    const pattern = /@([a-zA-Z_][a-zA-Z0-9_]*)/g;
    
    let match;
    while ((match = pattern.exec(content)) !== null) {
      decorators.push(match[1]);
    }

    return [...new Set(decorators)];
  }

  private extractDocstrings(content: string): any[] {
    const docstrings: any[] = [];
    const pattern = /"""([\s\S]*?)"""/g;
    
    let match;
    while ((match = pattern.exec(content)) !== null) {
      docstrings.push({
        content: match[1].trim(),
        line: this.getLineNumber(content, match.index)
      });
    }

    return docstrings;
  }
}