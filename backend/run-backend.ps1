$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$utf8 = [System.Text.UTF8Encoding]::new($false)
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8

$jvmEncodingArgs = '-Dfile.encoding=UTF-8 -Dsun.stdout.encoding=UTF-8 -Dsun.stderr.encoding=UTF-8'

if ([string]::IsNullOrWhiteSpace($env:JAVA_TOOL_OPTIONS)) {
    $env:JAVA_TOOL_OPTIONS = $jvmEncodingArgs
} else {
    $env:JAVA_TOOL_OPTIONS = "$jvmEncodingArgs $($env:JAVA_TOOL_OPTIONS)"
}

if ([string]::IsNullOrWhiteSpace($env:GRADLE_OPTS)) {
    $env:GRADLE_OPTS = $jvmEncodingArgs
} else {
    $env:GRADLE_OPTS = "$jvmEncodingArgs $($env:GRADLE_OPTS)"
}

& .\gradlew.bat --console=plain :backend:bootRun
exit $LASTEXITCODE
