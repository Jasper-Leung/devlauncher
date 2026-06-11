import * as fs from 'fs'
import * as path from 'path'

/**
 * 项目检测结果
 */
export interface ProjectDetection {
  /** 检测到的语言/技术栈 */
  language: string
  /** 推荐的启动命令 */
  startCommand: string
  /** 推荐的 IDE 命令 */
  ideCommand: string
  /** 项目描述（从 package.json 或其他配置文件提取） */
  description?: string
}

/**
 * 语言检测规则
 */
interface LanguageRule {
  /** 检测文件名 */
  files: string[]
  /** 语言名称 */
  language: string
  /** 启动命令模板 */
  startCommand: string
  /** IDE 命令 */
  ideCommand?: string
}

/**
 * 项目检测服务
 * 自动检测项目类型、语言和推荐命令
 */
export class ProjectDetectionService {
  /** 支持的语言检测规则 */
  private static readonly LANGUAGE_RULES: LanguageRule[] = [
    // JavaScript/TypeScript
    {
      files: ['package.json'],
      language: 'Node.js/JavaScript',
      startCommand: 'npm run dev',
      ideCommand: 'code .',
    },
    {
      files: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'],
      language: 'Node.js/JavaScript',
      startCommand: 'npm run dev',
      ideCommand: 'code .',
    },
    {
      files: ['tsconfig.json'],
      language: 'TypeScript',
      startCommand: 'npm run dev',
      ideCommand: 'code .',
    },
    // Python
    {
      files: [
        'requirements.txt',
        'setup.py',
        'setup.cfg',
        'pyproject.toml',
        'Pipfile',
        'poetry.lock',
      ],
      language: 'Python',
      startCommand: 'python main.py',
      ideCommand: 'code .',
    },
    // Go
    {
      files: ['go.mod'],
      language: 'Go',
      startCommand: 'go run .',
      ideCommand: 'code .',
    },
    // Rust
    {
      files: ['Cargo.toml'],
      language: 'Rust',
      startCommand: 'cargo run',
      ideCommand: 'code .',
    },
    // Java
    {
      files: ['pom.xml', 'build.gradle', 'build.gradle.kts', 'settings.gradle', 'gradlew'],
      language: 'Java',
      startCommand: 'mvn spring-boot:run',
      ideCommand: 'code .',
    },
    // Kotlin
    {
      files: ['build.gradle.kts', 'settings.gradle.kts'],
      language: 'Kotlin',
      startCommand: './gradlew bootRun',
      ideCommand: 'code .',
    },
    // C/C++
    {
      files: ['CMakeLists.txt', 'CMakeCache.txt', 'Makefile', 'makefile'],
      language: 'C/C++',
      startCommand: 'make && ./main',
      ideCommand: 'code .',
    },
    {
      files: ['main.c', 'main.cpp'],
      language: 'C/C++',
      startCommand: 'gcc main.c -o main && ./main',
      ideCommand: 'code .',
    },
    // C#
    {
      files: ['*.csproj', '*.sln'],
      language: 'C#',
      startCommand: 'dotnet run',
      ideCommand: 'code .',
    },
    // .NET
    {
      files: ['project.json', 'dotnet-project.json'],
      language: '.NET',
      startCommand: 'dotnet run',
      ideCommand: 'code .',
    },
    // Ruby
    {
      files: ['Gemfile', 'Rakefile'],
      language: 'Ruby',
      startCommand: 'bundle exec rails server',
      ideCommand: 'code .',
    },
    // PHP
    {
      files: ['composer.json'],
      language: 'PHP',
      startCommand: 'php artisan serve',
      ideCommand: 'code .',
    },
    // Swift
    {
      files: ['Package.swift'],
      language: 'Swift',
      startCommand: 'swift run',
      ideCommand: 'code .',
    },
    // Dart/Flutter
    {
      files: ['pubspec.yaml'],
      language: 'Dart/Flutter',
      startCommand: 'flutter run',
      ideCommand: 'code .',
    },
    // Elixir
    {
      files: ['mix.exs'],
      language: 'Elixir',
      startCommand: 'mix phx.server',
      ideCommand: 'code .',
    },
    // Crystal
    {
      files: ['shard.yml'],
      language: 'Crystal',
      startCommand: 'crystal run src/app.cr',
      ideCommand: 'code .',
    },
    // Lua
    {
      files: ['*.rockspec'],
      language: 'Lua',
      startCommand: 'lua main.lua',
      ideCommand: 'code .',
    },
    // Perl
    {
      files: ['Makefile.PL', 'Build.PL', 'cpanfile'],
      language: 'Perl',
      startCommand: 'perl main.pl',
      ideCommand: 'code .',
    },
    // Shell/Bash
    {
      files: ['*.sh', 'bashrc', '.bash_profile'],
      language: 'Shell',
      startCommand: './main.sh',
      ideCommand: 'code .',
    },
    // Scala
    {
      files: ['build.sbt', 'pom.xml'],
      language: 'Scala',
      startCommand: 'sbt run',
      ideCommand: 'code .',
    },
    // Haskell
    {
      files: ['package.yaml', '*.cabal', 'stack.yaml'],
      language: 'Haskell',
      startCommand: 'stack run',
      ideCommand: 'code .',
    },
    // R
    {
      files: ['DESCRIPTION', 'Rprofile'],
      language: 'R',
      startCommand: 'Rscript main.R',
      ideCommand: 'code .',
    },
    // Julia
    {
      files: ['Project.toml'],
      language: 'Julia',
      startCommand: 'julia main.jl',
      ideCommand: 'code .',
    },
    // Nim
    {
      files: ['*.nimble'],
      language: 'Nim',
      startCommand: 'nim run main.nim',
      ideCommand: 'code .',
    },
    // Vue.js
    {
      files: ['vue.config.js', 'nuxt.config.ts', 'vite.config.js'],
      language: 'Vue.js',
      startCommand: 'npm run dev',
      ideCommand: 'code .',
    },
    // React
    {
      files: ['next.config.js', 'next.config.mjs'],
      language: 'React/Next.js',
      startCommand: 'npm run dev',
      ideCommand: 'code .',
    },
    // Angular
    {
      files: ['angular.json'],
      language: 'Angular',
      startCommand: 'ng serve',
      ideCommand: 'code .',
    },
    // Svelte
    {
      files: ['svelte.config.js'],
      language: 'Svelte',
      startCommand: 'npm run dev',
      ideCommand: 'code .',
    },
    // SolidJS
    {
      files: ['solid.config.js'],
      language: 'SolidJS',
      startCommand: 'npm run dev',
      ideCommand: 'code .',
    },
    // Astro
    {
      files: ['astro.config.js', 'astro.config.mjs'],
      language: 'Astro',
      startCommand: 'npm run dev',
      ideCommand: 'code .',
    },
  ]

  /**
   * 检测项目类型
   * @param projectPath 项目路径
   * @returns 检测结果
   */
  static detect(projectPath: string): ProjectDetection {
    const detection: ProjectDetection = {
      language: 'Unknown',
      startCommand: '',
      ideCommand: 'code .',
    }

    // 检查是否存在该目录
    if (!fs.existsSync(projectPath)) {
      return detection
    }

    // 查找匹配的规则
    for (const rule of this.LANGUAGE_RULES) {
      for (const file of rule.files) {
        const filePath = path.join(projectPath, file)
        if (fs.existsSync(filePath)) {
          detection.language = rule.language
          detection.startCommand = rule.startCommand
          detection.ideCommand = rule.ideCommand || 'code .'

          // 尝试从 package.json 提取更多信息
          if (file === 'package.json') {
            try {
              const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
              if (packageJson.description) {
                detection.description = packageJson.description
              }
              // 如果有 scripts.dev，使用它作为启动命令
              if (packageJson.scripts?.dev) {
                detection.startCommand = 'npm run dev'
              } else if (packageJson.scripts?.start) {
                detection.startCommand = 'npm start'
              }
            } catch {
              // 忽略解析错误
            }
          }

          return detection
        }
      }
    }

    return detection
  }

  /**
   * 从路径提取项目名称
   * @param projectPath 项目路径
   * @returns 项目名称
   */
  static extractProjectName(projectPath: string): string {
    // 移除路径末尾的斜杠，避免获取到空字符串
    const trimmedPath = projectPath.replace(/[/\\]+$/, '')
    const pathParts = trimmedPath.split(/[/\\]/)
    return pathParts[pathParts.length - 1] || ''
  }

  /**
   * 生成项目标签
   * @param language 检测到的语言
   * @returns 标签数组
   */
  static generateTags(language: string): string[] {
    const tags: string[] = []

    // 根据语言添加标签
    if (language.includes('Node.js') || language.includes('JavaScript')) {
      tags.push('JavaScript', 'Node.js')
    } else if (language.includes('TypeScript')) {
      tags.push('TypeScript', 'Node.js')
    } else if (language.includes('Python')) {
      tags.push('Python')
    } else if (language.includes('Go')) {
      tags.push('Go')
    } else if (language.includes('Rust')) {
      tags.push('Rust')
    } else if (language.includes('Java')) {
      tags.push('Java')
    } else if (language.includes('Kotlin')) {
      tags.push('Kotlin', 'JVM')
    } else if (language.includes('C/C++')) {
      tags.push('C/C++', 'Native')
    } else if (language.includes('C#')) {
      tags.push('C#', '.NET')
    } else if (language.includes('.NET')) {
      tags.push('.NET')
    } else if (language.includes('Ruby')) {
      tags.push('Ruby')
    } else if (language.includes('PHP')) {
      tags.push('PHP')
    } else if (language.includes('Swift')) {
      tags.push('Swift', 'iOS')
    } else if (language.includes('Dart') || language.includes('Flutter')) {
      tags.push('Flutter', 'Dart')
    } else if (language.includes('Elixir')) {
      tags.push('Elixir')
    } else if (language.includes('Crystal')) {
      tags.push('Crystal')
    } else if (language.includes('Lua')) {
      tags.push('Lua')
    } else if (language.includes('Perl')) {
      tags.push('Perl')
    } else if (language.includes('Shell')) {
      tags.push('Shell', 'Bash')
    } else if (language.includes('Scala')) {
      tags.push('Scala', 'JVM')
    } else if (language.includes('Haskell')) {
      tags.push('Haskell')
    } else if (language === 'R' || language.includes('R (programming)')) {
      tags.push('R', 'Data Science')
    } else if (language.includes('Julia')) {
      tags.push('Julia', 'Scientific')
    } else if (language.includes('Nim')) {
      tags.push('Nim')
    } else if (language.includes('Vue')) {
      tags.push('Vue.js', 'Frontend')
    } else if (language.includes('React') || language.includes('Next.js')) {
      tags.push('React', 'Next.js', 'Frontend')
    } else if (language.includes('Angular')) {
      tags.push('Angular', 'Frontend')
    } else if (language.includes('Svelte')) {
      tags.push('Svelte', 'Frontend')
    } else if (language.includes('SolidJS')) {
      tags.push('SolidJS', 'Frontend')
    } else if (language.includes('Astro')) {
      tags.push('Astro', 'Frontend')
    } else {
      tags.push(language)
    }

    return tags
  }
}
