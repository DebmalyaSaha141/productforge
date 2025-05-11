document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const feedbackParam = urlParams.get('feedback');
  
  if (feedbackParam) {
    let feedbackMessage = document.querySelector('.feedback-message');
    
    if (!feedbackMessage) {
      feedbackMessage = document.createElement('div');
      feedbackMessage.className = 'feedback-message';
      const main = document.querySelector('main');
      if (main) {
        main.insertBefore(feedbackMessage, main.firstChild);
      }
    }
    
    feedbackMessage.textContent = feedbackParam;
    feedbackMessage.style.display = 'block';
    feedbackMessage.style.opacity = '1';
    
    setTimeout(() => {
      feedbackMessage.style.opacity = '0';
      setTimeout(() => {
        feedbackMessage.style.display = 'none';
        
        const url = new URL(window.location);
        url.searchParams.delete('feedback');
        window.history.replaceState({}, '', url);
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
        alert('This functionality is not implemented.');
      });
    }
  });
});