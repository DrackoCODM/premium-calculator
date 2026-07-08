document.addEventListener('DOMContentLoaded', () => {
  
  // --- State Variables ---
  let currentExpression = '0';
  let historyExpression = '';
  let storedFormula = '';
  let storedAnswer = '';
  let isNewCalculation = true;
  
  // Onboarding states
  let userName = 'User';
  let selectedTheme = 'gold';

  // --- DOM Elements ---
  const appContainer = document.getElementById('app-container');
  const splashScreen = document.getElementById('splash-screen');
  const calculatorScreen = document.getElementById('calculator-screen');
  const calcHistory = document.getElementById('calc-history');
  const calcCurrent = document.getElementById('calc-current');
  
  const premiumOverlay = document.getElementById('premium-overlay');
  const premiumSheet = document.getElementById('premium-sheet');
  const btnPayTrigger = document.getElementById('btn-pay-trigger');
  const btnCancelUnlock = document.getElementById('btn-cancel-unlock');
  
  const paymentScreen = document.getElementById('payment-screen');
  const btnPaymentBack = document.getElementById('btn-payment-back');
  const paymentLoader = document.getElementById('payment-loader');
  const btnConfirmPayment = document.getElementById('btn-confirm-payment');
  
  const revealScreen = document.getElementById('reveal-screen');
  const revealLoading = document.getElementById('reveal-loading');
  const revealSuccess = document.getElementById('reveal-success');
  const unlockAnimation = document.querySelector('.unlock-animation');
  const revealExpr = document.getElementById('reveal-expr');
  const revealAns = document.getElementById('reveal-ans');
  const btnCalcReset = document.getElementById('btn-calc-reset');

  // Onboarding DOM Elements
  const onboardingScreen = document.getElementById('onboarding-screen');
  const onboardLogin = document.getElementById('onboard-login');
  const onboardTheme = document.getElementById('onboard-theme');
  const userNameInput = document.getElementById('user-name-input');
  const btnLoginSubmit = document.getElementById('btn-login-submit');
  const welcomeName = document.getElementById('welcome-name');
  const themeCards = document.querySelectorAll('.theme-card');
  const btnThemeSubmit = document.getElementById('btn-theme-submit');
  const successUserName = document.getElementById('success-user-name');

  // --- Splash Screen Dismissal ---
  setTimeout(() => {
    splashScreen.classList.remove('active');
    // Transition to Onboarding Login phase instead of direct to calculator
    onboardingScreen.classList.add('active');
    // Default theme initialized
    appContainer.classList.add('theme-gold');
  }, 2000);

  // --- Onboarding Login Flow ---
  userNameInput.addEventListener('input', () => {
    const val = userNameInput.value.trim();
    btnLoginSubmit.disabled = val.length === 0;
  });

  userNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && userNameInput.value.trim().length > 0) {
      btnLoginSubmit.click();
    }
  });

  btnLoginSubmit.addEventListener('click', () => {
    userName = userNameInput.value.trim() || 'User';
    welcomeName.textContent = userName;
    onboardLogin.classList.remove('active');
    onboardTheme.classList.add('active');
  });

  // --- Onboarding Theme Live Preview Flow ---
  themeCards.forEach(card => {
    card.addEventListener('click', () => {
      themeCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedTheme = card.getAttribute('data-theme') || 'gold';
      
      // Update class to preview the variables live
      appContainer.className = ''; 
      appContainer.classList.add('theme-' + selectedTheme);
    });
  });

  // --- Onboarding Launch Calculator ---
  btnThemeSubmit.addEventListener('click', () => {
    onboardingScreen.classList.remove('active');
    calculatorScreen.classList.add('active');
    successUserName.textContent = userName;
  });

  // --- Responsive Text Resizing for Display ---
  function adjustFontSize() {
    const len = currentExpression.length;
    if (len > 12) {
      calcCurrent.style.fontSize = '32px';
    } else if (len > 8) {
      calcCurrent.style.fontSize = '44px';
    } else {
      calcCurrent.style.fontSize = '64px';
    }
  }

  // --- Display Update ---
  function updateDisplay() {
    // Format presentation operators
    let displayFormat = currentExpression
      .replace(/\*/g, ' × ')
      .replace(/\//g, ' ÷ ')
      .replace(/-/g, ' − ')
      .replace(/\+/g, ' + ');
    
    calcCurrent.textContent = displayFormat;
    calcHistory.textContent = historyExpression;
    adjustFontSize();
  }

  // --- Safe Math Evaluation ---
  function evaluateSafely(expr) {
    let parsed = expr.trim();
    // Replace percentages: e.g. "15%" -> "(15/100)"
    parsed = parsed.replace(/(\d+(\.\d+)?)%/g, '($1/100)');

    if (!/^[0-9.+\-*/() ]+$/.test(parsed)) {
      throw new Error('Invalid format');
    }

    const evaluator = new Function(`return (${parsed});`);
    const result = evaluator();

    if (result === undefined || isNaN(result) || !isFinite(result)) {
      throw new Error('Math error');
    }

    if (Number.isInteger(result)) {
      return result.toString();
    } else {
      return parseFloat(result.toFixed(8)).toString();
    }
  }

  // --- Keypad Click Handlers ---
  const keys = document.querySelectorAll('.key');
  keys.forEach(key => {
    key.addEventListener('click', () => {
      const action = key.getAttribute('data-action');
      const val = key.getAttribute('data-val') || key.textContent;
      
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }

      handleInput(action, val);
    });
  });

  function handleInput(action, val) {
    if (action === 'clear') {
      currentExpression = '0';
      historyExpression = '';
      isNewCalculation = false;
      updateDisplay();
      return;
    }

    if (action === 'delete') {
      if (currentExpression !== '0') {
        currentExpression = currentExpression.slice(0, -1);
        if (currentExpression === '' || currentExpression === '-') {
          currentExpression = '0';
        }
      }
      updateDisplay();
      return;
    }

    if (action === 'calculate') {
      if (currentExpression === '0' || currentExpression === '') return;

      try {
        const answer = evaluateSafely(currentExpression);
        storedFormula = currentExpression
          .replace(/\*/g, ' × ')
          .replace(/\//g, ' ÷ ')
          .replace(/-/g, ' − ')
          .replace(/\+/g, ' + ');
        storedAnswer = answer;

        showUnlockModal();
      } catch (err) {
        currentExpression = 'Error';
        isNewCalculation = true;
        updateDisplay();
      }
      return;
    }

    if (isNewCalculation && action === 'number') {
      currentExpression = '';
      isNewCalculation = false;
    } else if (isNewCalculation && (action === 'operator' || action === 'percent')) {
      isNewCalculation = false;
    }

    if (action === 'number') {
      if (currentExpression === '0') {
        currentExpression = val;
      } else {
        currentExpression += val;
      }
    } else if (action === 'decimal') {
      const terms = currentExpression.split(/[\+\-\*\/]/);
      const currentTerm = terms[terms.length - 1];
      if (!currentTerm.includes('.')) {
        currentExpression += '.';
      }
    } else if (action === 'operator') {
      const lastChar = currentExpression.slice(-1);
      if (['+', '-', '*', '/'].includes(lastChar)) {
        currentExpression = currentExpression.slice(0, -1) + val;
      } else {
        currentExpression += val;
      }
    } else if (action === 'percent') {
      const lastChar = currentExpression.slice(-1);
      if (/[0-9]/.test(lastChar)) {
        currentExpression += '%';
      }
    }

    updateDisplay();
  }

  // --- Modal Navigation Flow ---

  function showUnlockModal() {
    premiumOverlay.classList.add('active');
  }

  function hideUnlockModal() {
    premiumOverlay.classList.remove('active');
  }

  btnCancelUnlock.addEventListener('click', hideUnlockModal);

  premiumOverlay.addEventListener('click', (e) => {
    if (e.target === premiumOverlay) {
      hideUnlockModal();
    }
  });

  // Screen 4: Payment Page Flow
  btnPayTrigger.addEventListener('click', () => {
    calculatorScreen.classList.remove('active');
    hideUnlockModal();
    paymentScreen.classList.add('active');

    // Reset loader states
    paymentLoader.classList.remove('hidden');
    btnConfirmPayment.classList.add('hidden');

    // Extended payment verification delay (10.0 seconds as requested)
    setTimeout(() => {
      paymentLoader.classList.add('hidden');
      btnConfirmPayment.classList.remove('hidden');
    }, 10000);
  });

  btnPaymentBack.addEventListener('click', () => {
    paymentScreen.classList.remove('active');
    calculatorScreen.classList.add('active');
  });

  // Screen 5: Verification & Result Reveal
  btnConfirmPayment.addEventListener('click', () => {
    paymentScreen.classList.remove('active');
    revealScreen.classList.add('active');

    revealLoading.classList.add('active');
    revealSuccess.classList.remove('active');
    unlockAnimation.classList.remove('unlocked');

    setTimeout(() => {
      unlockAnimation.classList.add('unlocked');
    }, 500);

    // Transition loading state to success display after 1800ms
    setTimeout(() => {
      revealLoading.classList.remove('active');
      revealSuccess.classList.add('active');
      
      revealExpr.textContent = storedFormula;
      revealAns.textContent = storedAnswer;

      // Reset expression values for subsequent calculations
      currentExpression = '0';
      historyExpression = '';
      updateDisplay();
    }, 1800);
  });

  // Return to Calculator from Success Screen
  btnCalcReset.addEventListener('click', () => {
    revealScreen.classList.remove('active');
    calculatorScreen.classList.add('active');
    isNewCalculation = true;
  });

  // Keyboard controls
  document.addEventListener('keydown', (e) => {
    if (!calculatorScreen.classList.contains('active') || premiumOverlay.classList.contains('active')) {
      return;
    }

    if (e.key >= '0' && e.key <= '9') {
      handleInput('number', e.key);
    } else if (e.key === '.') {
      handleInput('decimal', '.');
    } else if (e.key === '+') {
      handleInput('operator', '+');
    } else if (e.key === '-') {
      handleInput('operator', '-');
    } else if (e.key === '*') {
      handleInput('operator', '*');
    } else if (e.key === '/') {
      handleInput('operator', '/');
    } else if (e.key === '%') {
      handleInput('percent', '%');
    } else if (e.key === 'Enter' || e.key === '=') {
      handleInput('calculate', '=');
    } else if (e.key === 'Backspace') {
      handleInput('delete');
    } else if (e.key === 'Escape') {
      handleInput('clear');
    }
  });

  // --- Service Worker Registration for PWA ---
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('Service Worker registered!'))
        .catch(err => console.log('Service Worker registration failed:', err));
    });
  }

});
