export const PROJECT_TYPE_CONFIG: Record<
  string,
  {
    tags: string[]
    defaultCommand: string
    profileType: 'frontend' | 'backend' | 'docker'
  }
> = {
  // JavaScript/TypeScript
  'Node.js/JavaScript': {
    tags: ['JavaScript', 'Node.js'],
    defaultCommand: 'npm run dev',
    profileType: 'frontend',
  },
  TypeScript: {
    tags: ['TypeScript', 'Node.js'],
    defaultCommand: 'npm run dev',
    profileType: 'frontend',
  },
  'React/Next.js': {
    tags: ['React', 'Next.js', 'Frontend'],
    defaultCommand: 'npm run dev',
    profileType: 'frontend',
  },
  'Vue.js': {
    tags: ['Vue.js', 'Frontend'],
    defaultCommand: 'npm run dev',
    profileType: 'frontend',
  },
  Angular: {
    tags: ['Angular', 'Frontend'],
    defaultCommand: 'ng serve',
    profileType: 'frontend',
  },
  Svelte: {
    tags: ['Svelte', 'Frontend'],
    defaultCommand: 'npm run dev',
    profileType: 'frontend',
  },
  SolidJS: {
    tags: ['SolidJS', 'Frontend'],
    defaultCommand: 'npm run dev',
    profileType: 'frontend',
  },
  Astro: {
    tags: ['Astro', 'Frontend'],
    defaultCommand: 'npm run dev',
    profileType: 'frontend',
  },

  // Backend Languages
  Python: {
    tags: ['Python'],
    defaultCommand: 'python main.py',
    profileType: 'backend',
  },
  Go: {
    tags: ['Go'],
    defaultCommand: 'go run .',
    profileType: 'backend',
  },
  Rust: {
    tags: ['Rust'],
    defaultCommand: 'cargo run',
    profileType: 'backend',
  },
  Java: {
    tags: ['Java'],
    defaultCommand: 'mvn spring-boot:run',
    profileType: 'backend',
  },
  Kotlin: {
    tags: ['Kotlin', 'JVM'],
    defaultCommand: './gradlew bootRun',
    profileType: 'backend',
  },
  Ruby: {
    tags: ['Ruby'],
    defaultCommand: 'bundle exec rails server',
    profileType: 'backend',
  },
  PHP: {
    tags: ['PHP'],
    defaultCommand: 'php artisan serve',
    profileType: 'backend',
  },
  Elixir: {
    tags: ['Elixir'],
    defaultCommand: 'mix phx.server',
    profileType: 'backend',
  },
  Crystal: {
    tags: ['Crystal'],
    defaultCommand: 'crystal run src/app.cr',
    profileType: 'backend',
  },
  Scala: {
    tags: ['Scala', 'JVM'],
    defaultCommand: 'sbt run',
    profileType: 'backend',
  },
  Haskell: {
    tags: ['Haskell'],
    defaultCommand: 'stack run',
    profileType: 'backend',
  },
  Julia: {
    tags: ['Julia', 'Scientific'],
    defaultCommand: 'julia main.jl',
    profileType: 'backend',
  },
  Nim: {
    tags: ['Nim'],
    defaultCommand: 'nim run main.nim',
    profileType: 'backend',
  },

  // Native Languages
  'C/C++': {
    tags: ['C/C++', 'Native'],
    defaultCommand: 'make && ./main',
    profileType: 'backend',
  },
  'C#': {
    tags: ['C#', '.NET'],
    defaultCommand: 'dotnet run',
    profileType: 'backend',
  },
  '.NET': {
    tags: ['.NET'],
    defaultCommand: 'dotnet run',
    profileType: 'backend',
  },
  Swift: {
    tags: ['Swift', 'iOS'],
    defaultCommand: 'swift run',
    profileType: 'backend',
  },

  // Scripting Languages
  Shell: {
    tags: ['Shell', 'Bash'],
    defaultCommand: './main.sh',
    profileType: 'backend',
  },
  Lua: {
    tags: ['Lua'],
    defaultCommand: 'lua main.lua',
    profileType: 'backend',
  },
  Perl: {
    tags: ['Perl'],
    defaultCommand: 'perl main.pl',
    profileType: 'backend',
  },

  // Data Science
  R: {
    tags: ['R', 'Data Science'],
    defaultCommand: 'Rscript main.R',
    profileType: 'backend',
  },

  // Mobile
  'Dart/Flutter': {
    tags: ['Flutter', 'Dart'],
    defaultCommand: 'flutter run',
    profileType: 'frontend',
  },
}
