// Function to convert IST to EST
function convertISTtoEST(istTime) {
    // IST is UTC+5:30, EST is UTC-5:00
    // Difference: IST is 10 hours 30 minutes ahead of EST
    
    // Parse the time (supports formats like "7:00 PM", "19:00", "7 PM")
    const timeMatch = istTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!timeMatch) {
        // If no match, try format without minutes like "7 PM"
        const simpleMatch = istTime.match(/(\d{1,2})\s*(AM|PM)/i);
        if (!simpleMatch) return istTime; // Return original if can't parse
        
        let hours = parseInt(simpleMatch[1]);
        const period = simpleMatch[2].toUpperCase();
        
        // Convert to 24-hour format
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        // Subtract 10 hours 30 minutes
        hours -= 10;
        let minutes = -30;
        
        if (minutes < 0) {
            hours -= 1;
            minutes = 30;
        }
        
        // Handle day overflow
        if (hours < 0) hours += 24;
        if (hours >= 24) hours -= 24;
        
        // Convert back to 12-hour format
        const estPeriod = hours >= 12 ? 'PM' : 'AM';
        let estHours = hours % 12;
        if (estHours === 0) estHours = 12;
        
        return `${estHours}:${minutes.toString().padStart(2, '0')} ${estPeriod} EST`;
    }
    
    let hours = parseInt(timeMatch[1]);
    let minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3] ? timeMatch[3].toUpperCase() : null;
    
    // Convert to 24-hour format if AM/PM is specified
    if (period) {
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
    }
    
    // Subtract 10 hours 30 minutes for EST
    minutes -= 30;
    if (minutes < 0) {
        hours -= 1;
        minutes += 60;
    }
    hours -= 10;
    
    // Handle day overflow
    if (hours < 0) hours += 24;
    if (hours >= 24) hours -= 24;
    
    // Convert back to 12-hour format
    const estPeriod = hours >= 12 ? 'PM' : 'AM';
    let estHours = hours % 12;
    if (estHours === 0) estHours = 12;
    
    return `${estHours}:${minutes.toString().padStart(2, '0')} ${estPeriod} EST`;
}

// Global function to initialize page with templates
function initializePage(templates) {
    const form = document.getElementById('gameForm');
    const outputSection = document.getElementById('outputSection');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const teamA = document.getElementById('teamA').value.trim();
        const teamB = document.getElementById('teamB').value.trim();
        const date = document.getElementById('date').value.trim();
        const timeIST = document.getElementById('time').value.trim();
        
        // Convert IST to EST
        const time = convertISTtoEST(timeIST);
        
        // Generate content
        const title = generateContent(templates.title, teamA, teamB, date, time);
        const description = generateContent(templates.description, teamA, teamB, date, time);
        
        // Display results
        document.getElementById('titleOutput').textContent = title;
        document.getElementById('descriptionOutput').textContent = description;
        
        // Generate and display tags individually
        const tagsContainer = document.getElementById('tagsOutput');
        tagsContainer.innerHTML = '';
        templates.tags.forEach((tagTemplate, index) => {
            const tag = generateContent(tagTemplate, teamA, teamB, date, time);
            const tagElement = document.createElement('div');
            tagElement.className = 'tag-item';
            tagElement.innerHTML = `
                <div class="tag-text">${tag}</div>
                <button class="btn-copy-tag" onclick="copyTag('${tag.replace(/'/g, "\\'")}')">Copy</button>
            `;
            tagsContainer.appendChild(tagElement);
        });
        
        // Show output section with animation
        outputSection.style.display = 'block';
        outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
}

// Function to replace placeholders with actual values
function generateContent(template, teamA, teamB, date, time) {
    let result = template;
    
    // For hashtags, remove ALL spaces from team names (join all words)
    const teamAHashtag = teamA.replace(/\s+/g, '');
    const teamBHashtag = teamB.replace(/\s+/g, '');
    
    // Replace hashtag placeholders first
    result = result.replace(/#{Team A}/g, `#${teamAHashtag}`);
    result = result.replace(/#{Team B}/g, `#${teamBHashtag}`);
    
    // Then replace regular placeholders
    result = result.replace(/{Team A}/g, teamA);
    result = result.replace(/{Team B}/g, teamB);
    result = result.replace(/{Date}/g, date);
    result = result.replace(/{Time}/g, time);
    
    return result;
}

// Function to copy content to clipboard
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;
    
    // Create temporary textarea
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    
    // Select and copy
    textarea.select();
    textarea.setSelectionRange(0, 99999); // For mobile devices
    
    try {
        document.execCommand('copy');
        
        // Visual feedback
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.background = '#28a745';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard');
    }
    
    document.body.removeChild(textarea);
}

// Function to copy individual tag
function copyTag(tagText) {
    // Create temporary textarea
    const textarea = document.createElement('textarea');
    textarea.value = tagText;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    
    // Select and copy
    textarea.select();
    textarea.setSelectionRange(0, 99999);
    
    try {
        document.execCommand('copy');
        
        // Visual feedback
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.background = '#28a745';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard');
    }
    
    document.body.removeChild(textarea);
}
