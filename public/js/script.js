
document.addEventListener('DOMContentLoaded', function() {

  const feedbackMessage = document.querySelector('.feedback-message');
  if (feedbackMessage) {
    setTimeout(() => {
      feedbackMessage.style.opacity = '0';
      setTimeout(() => {
        feedbackMessage.style.display = 'none';
      }, 500);
    }, 5000);
  }


  const codeExamples = document.querySelectorAll('.code-example, #settings-display');
  codeExamples.forEach(block => {

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

  const actionButtons = document.querySelectorAll('.product-actions .btn');
  actionButtons.forEach(button => {
    if (button.textContent.includes('Edit') || button.textContent.includes('Delete')) {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        alert('This functionality is not implemented in the CTF challenge.');
      });
    }
  });

  console.log('%cHint: Look for ways to modify Object properties...', 'color: blue; font-weight: bold');
  console.log('%cTry exploring how the customization settings are merged!', 'color: green');
});