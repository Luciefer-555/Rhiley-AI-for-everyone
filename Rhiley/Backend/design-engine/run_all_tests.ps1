$tests = @(
  # WEB1
  "node scratch_test_full_build.js `"test-images\WEB1.png`"",
  # WEB2
  "node scratch_test_full_build.js `"test-images\WEB2.png`"",
  # Phase 2 detailed fitness
  "node scratch_test_full_build.js `"Build a landing page for a fitness app, hero headline 'Train Smarter', pricing section with 3 tiers, testimonials section`"",
  # Phase 3 vague bakery
  "node scratch_test_full_build.js `"make me a bakery website`"",
  # Phase 3 vague portfolio
  "node scratch_test_full_build.js `"make me a portfolio site`"",
  # Phase 3 vague fitness
  "node scratch_test_full_build.js `"make me a fitness app`"",
  # Phase 5 hybrid vague
  "node scratch_test_full_build.js `"test-images\WEB3.jpg`" `"make me a bakery website`"",
  # Phase 5 hybrid detailed
  "node scratch_test_full_build.js `"test-images\WEB4.jpg`" `"Build a landing page for a fitness app, hero headline 'Train Smarter', pricing section with 3 tiers, testimonials section`""
)

foreach ($cmd in $tests) {
  Write-Host "Running: $cmd"
  $output = Invoke-Expression $cmd 2>&1
  $selected = $output | Select-String -Pattern "Selected Template"
  $reason = $output | Select-String -Pattern "Reason:"
  if ($selected) {
    Write-Host $selected
  } else {
    Write-Host "FAILED TO SELECT TEMPLATE"
  }
  if ($reason) { Write-Host $reason }
  Write-Host "-----------------"
}
