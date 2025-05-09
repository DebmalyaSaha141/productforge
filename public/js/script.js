// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Auto-hide feedback messages after 5 seconds
  const feedbackMessage = document.querySelector('.feedback-message');
  if (feedbackMessage && feedbackMessage.textContent.trim() !== '') {
    // Make sure the feedback is visible initially
    feedbackMessage.style.display = 'block';
    feedbackMessage.style.opacity = '1';
    
    // Set timeout to hide it
    setTimeout(() => {
      feedbackMessage.style.opacity = '0';
      setTimeout(() => {
        feedbackMessage.style.display = 'none';
      }, 500);
    }, 5000);
  }
  
  // Add syntax highlighting effect to code examples
  const codeExamples = document.querySelectorAll('.code-example, #settings-display');
  codeExamples.forEach(block => {
    // Simple syntax highlighting for JSON and JavaScript
    const content = block.innerHTML;
    const highlighted = content
      .replace(/(\"[^\"]*\"):/g, '<span style="color: var(--primary-color)">$1</span>:')
      .replace(/(\"[^\"]*\")/g, '<span style="color: var(--success-color)">$1</span>')
      .replace(/(\{|\}|\[|\])/g, '<span style="color: var(--accent-color)">$1</span>')
      .replace(/(true|false|null)/g, '<span style="color: var(--danger-color)">$1</span>')
      .replace(/(\d+)/g, '<span style="color: var(--secondary-color)">$1</span>')
      .replace(/(function|const|let|var|return|if|else|for|while)/g, '<span style="font-weight: bold;">$1</span>');
      
    block.innerHTML = highlighted;
  });
  
  // Add event listeners to buttons with disabled functionality
  const actionButtons = document.querySelectorAll('.product-actions .btn');
  actionButtons.forEach(button => {
    if (button.textContent.includes('Edit') || button.textContent.includes('Delete')) {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        alert('This functionality is not implemented in the CTF challenge.');
      });
    }
  });
  
  // Customize UI form setup
  const customizeForm = document.getElementById('customize-form');
  if (customizeForm) {
    // Add pre-filled example to help users understand the vulnerability
    const exampleButton = document.createElement('button');
    exampleButton.type = 'button';
    exampleButton.className = 'btn btn-secondary';
    exampleButton.textContent = 'Show Payload Example';
    exampleButton.onclick = function() {
      const settingsInput = document.getElementById('settings-input');
      if (settingsInput) {
        settingsInput.value = JSON.stringify({
          "colorScheme": "dark",
          "fontSize": "large",
          "__proto__": {
            "exampleProperty": "This is how prototype pollution works!"
          }
        }, null, 2);
      }
    };
    
    customizeForm.appendChild(exampleButton);
  }
  
  // Add a subtle hint about prototype pollution in console
  console.log('%cHint: Look for ways to modify Object properties...', 'color: blue; font-weight: bold');
  console.log('%cTry exploring how the customization settings are merged!', 'color: green');
  console.log('%cPayload example: {"__proto__": {"isAdmin": true}}', 'color: red; font-weight: bold');
});