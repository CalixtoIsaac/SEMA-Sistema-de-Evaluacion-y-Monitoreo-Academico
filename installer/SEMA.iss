; Instalador de SEMA para Windows (Inno Setup 6).
; Antes de compilar, genera dist\SEMA con PyInstaller (installer\sema.spec).
; Compilar desde la raíz del repositorio:
;   iscc /DMyAppVersion=1.0.0 installer\SEMA.iss
; El instalador queda en installer\Output\SEMA-Setup-<versión>.exe

#ifndef MyAppVersion
  #define MyAppVersion "1.0.0"
#endif
#ifndef MyAppVersionNum
  #define MyAppVersionNum MyAppVersion
#endif
#define MyAppName "SEMA"
#define MyAppFullName "SEMA - Sistema de Evaluación y Monitoreo Académico"
#define MyAppPublisher "Equipo SEMA"
#define MyAppURL "https://github.com/CalixtoIsaac/SEMA-Sistema-de-Evaluacion-y-Monitoreo-Academico"
#define MyAppExeName "SEMA.exe"

[Setup]
; No cambies AppId: es lo que permite que una versión nueva actualice a la anterior.
AppId={{6F1B3C2A-5E4D-4A8B-9C7E-2D1F0A9B8C61}
AppName={#MyAppFullName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}/issues
AppUpdatesURL={#MyAppURL}/releases
; Instalación por usuario: no pide permisos de administrador.
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=Output
OutputBaseFilename=SEMA-Setup-{#MyAppVersion}
SetupIconFile=sema.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppFullName}
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0
CloseApplications=yes
VersionInfoVersion={#MyAppVersionNum}
VersionInfoProductName={#MyAppFullName}

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Dirs]
; Carpeta de datos (app.db, jwt.secret). No se borra al desinstalar salvo que el usuario lo pida.
Name: "{localappdata}\SEMA"; Flags: uninsneveruninstall

[Files]
Source: "..\dist\SEMA\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[InstallDelete]
; Limpia archivos de una versión anterior antes de copiar la nueva.
Type: filesandordirs; Name: "{app}\_internal"

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Comment: "{#MyAppFullName}"
Name: "{group}\Carpeta de datos de SEMA"; Filename: "{localappdata}\SEMA"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon; Comment: "{#MyAppFullName}"

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#MyAppName}}"; Flags: nowait postinstall skipifsilent

[Code]
procedure CerrarSEMA();
var
  Codigo: Integer;
begin
  // Si SEMA está abierto, se cierra para poder reemplazar o borrar sus archivos.
  Exec(ExpandConstant('{sys}\taskkill.exe'), '/F /IM {#MyAppExeName}', '', SW_HIDE, ewWaitUntilTerminated, Codigo);
end;

function PrepareToInstall(var NeedsRestart: Boolean): String;
begin
  CerrarSEMA();
  Result := '';
end;

function InitializeUninstall(): Boolean;
begin
  CerrarSEMA();
  Result := True;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  Datos: String;
begin
  if CurUninstallStep = usPostUninstall then
  begin
    Datos := ExpandConstant('{localappdata}\SEMA');
    if DirExists(Datos) and not UninstallSilent() then
      if MsgBox('¿También quieres borrar los datos de SEMA (alumnos, calificaciones y tu cuenta)?' + #13#10 + #13#10 +
                'Si vas a reinstalar SEMA, elige "No" para conservarlos.' + #13#10 + Datos,
                mbConfirmation, MB_YESNO or MB_DEFBUTTON2) = IDYES then
        DelTree(Datos, True, True, True);
  end;
end;
