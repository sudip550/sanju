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
        
        // Check if bulk input exists
        const bulkInput = document.getElementById('bulkInput');
        
        if (bulkInput) {
            // Bulk generation mode
            const bulkText = bulkInput.value.trim();
            if (!bulkText) {
                alert('Please enter match details');
                return;
            }
            
            processBulkInput(bulkText, templates, outputSection);
        } else {
            // Single match mode (original functionality)
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
        }
    });
}

// Function to process bulk input
function processBulkInput(bulkText, templates, outputSection) {
    const lines = bulkText.split('\n').map(line => line.trim()).filter(line => line);
    
    let currentDate = '';
    const matches = [];
    
    // Parse the input
    for (const line of lines) {
        // Check if it's a date line
        if (line.toLowerCase().startsWith('date =') || line.toLowerCase().startsWith('date=')) {
            currentDate = line.split('=')[1].trim();
        }
        // Check if it's a match line
        else if (line.includes('⏰') && line.includes('|')) {
            const match = parseMatchLine(line, currentDate);
            if (match) {
                matches.push(match);
            }
        }
    }
    
    if (matches.length === 0) {
        alert('No valid matches found. Please check the format.');
        return;
    }
    
    // Generate output for all matches
    displayBulkOutput(matches, templates, outputSection);
}

// Function to parse a single match line
function parseMatchLine(line, date) {
    try {
        // Remove emojis and split by |
        const parts = line.split('|').map(p => p.trim());
        
        if (parts.length < 2) return null;
        
        // Extract time (first part after ⏰)
        const timePart = parts[0].replace('⏰', '').trim();
        
        // Detect league type from middle parts
        let leagueType = null;
        const middleParts = parts.slice(1, -1).join(' ').toLowerCase();
        
        if (middleParts.includes('👩') || middleParts.includes('women')) {
            leagueType = 'women';
        } else if (middleParts.includes('👨') || middleParts.includes('men')) {
            leagueType = 'men';
        }
        
        // Extract teams from the last part (format: "Team A @ Team B")
        const teamsPart = parts[parts.length - 1];
        const teamsMatch = teamsPart.match(/(.+?)\s*@\s*(.+)/);
        
        if (!teamsMatch) return null;
        
        const teamA = teamsMatch[1].trim();
        const teamB = teamsMatch[2].trim();
        
        return {
            teamA,
            teamB,
            date,
            timeIST: timePart,
            leagueType
        };
    } catch (err) {
        console.error('Error parsing line:', line, err);
        return null;
    }
}

// Function to display bulk output
function displayBulkOutput(matches, templates, outputSection) {
    outputSection.innerHTML = '<h2>Generated Content for All Matches</h2>';
    
    matches.forEach((match, index) => {
        const time = convertISTtoEST(match.timeIST);
        
        // Select appropriate template based on league type (for combined NCAA)
        let currentTemplates = templates;
        if (templates.men && templates.women && match.leagueType) {
            currentTemplates = match.leagueType === 'women' ? templates.women : templates.men;
        }
        
        // Generate content for this match
        const title = generateContent(currentTemplates.title, match.teamA, match.teamB, match.date, time);
        const description = generateContent(currentTemplates.description, match.teamA, match.teamB, match.date, time);
        
        // Create league badge for combined mode
        const leagueBadge = match.leagueType ? 
            `<span style="background: ${match.leagueType === 'women' ? '#e91e63' : '#2196f3'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; margin-left: 10px;">${match.leagueType === 'women' ? '👩 WOMEN' : '👨 MEN'}</span>` : '';
        
        // Create match container
        const matchContainer = document.createElement('div');
        matchContainer.className = 'bulk-match-container';
        matchContainer.innerHTML = `
            <h3 class="match-header">Match ${index + 1}: ${match.teamA} vs ${match.teamB}${leagueBadge}</h3>
            
            <div class="output-box">
                <div class="output-header">
                    <h3>📝 Title</h3>
                    <button class="btn-copy" onclick="copyToClipboard('titleOutput-${index}')">Copy</button>
                </div>
                <div id="titleOutput-${index}" class="output-content">${title}</div>
            </div>
            
            <div class="output-box">
                <div class="output-header">
                    <h3>📄 Description</h3>
                    <button class="btn-copy" onclick="copyToClipboard('descriptionOutput-${index}')">Copy</button>
                </div>
                <div id="descriptionOutput-${index}" class="output-content">${description}</div>
            </div>
            
            <div class="output-box">
                <div class="output-header">
                    <h3>🏷️ Tags</h3>
                </div>
                <div id="tagsOutput-${index}" class="tags-container"></div>
            </div>
        `;
        
        outputSection.appendChild(matchContainer);
        
        // Generate and display tags
        const tagsContainer = document.getElementById(`tagsOutput-${index}`);
        currentTemplates.tags.forEach((tagTemplate) => {
            const tag = generateContent(tagTemplate, match.teamA, match.teamB, match.date, time);
            const tagElement = document.createElement('div');
            tagElement.className = 'tag-item';
            tagElement.innerHTML = `
                <div class="tag-text">${tag}</div>
                <button class="btn-copy-tag" onclick="copyTag('${tag.replace(/'/g, "\\'")}')">Copy</button>
            `;
            tagsContainer.appendChild(tagElement);
        });
    });
    
    // Show output section
    outputSection.style.display = 'block';
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
