@echo off
echo.
echo  RHILEY — COPYING DATASETS
echo  ====================================

set SRC=C:\Users\saipr\Downloads\Rhiley\Backend\UI COMP
set DST=C:\Users\saipr\Downloads\Rhiley\chat\public\datasets

mkdir "%DST%" 2>nul

echo Copying all JSON datasets from UI COMP...
copy "%SRC%\*.json" "%DST%\" /Y

echo.
echo  ====================================
echo  DONE! All datasets copied.
echo  ====================================
echo  Check browser console for:
echo  [Rhiley Dataset] Indexed X examples
echo  ====================================
pause
