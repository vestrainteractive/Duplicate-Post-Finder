jQuery(document).ready(function ($) {
    $('#check-duplicates').on('click', function () {
        const $results = $('#duplicate-results');
        const $statusBar = $('#status-bar');
        const $progressBar = $('#progress-bar');
        const $progressPercent = $('#progress-percent');
        const $statusMessage = $('#status-message');
        const $debugLog = $('#debug-log');

        let isProcessing = false;
        let timeout;

        // Reset UI
        $results.empty();
        $statusBar.show();
        $progressBar.width('0%');
        $progressPercent.text('0%');
        $statusMessage.text('Initializing duplicate check...').css('color', '');
        $debugLog.hide().text('');

        // Timeout logic: After 30 seconds, check if progress has started
        timeout = setTimeout(() => {
            if (!isProcessing) {
                $statusMessage.text('Error: No response from server within 30 seconds.').css('color', 'red');
                $debugLog.show().append('Timeout reached: No progress after 30 seconds.\n');
            }
        }, 30000);

        // Start AJAX request
        $.post(checker_vars.ajax_url, { action: 'check_duplicates' })
            .done(function (response) {
                clearTimeout(timeout); // Clear timeout once the server responds

                if (response.success) {
                    const duplicates = response.data.duplicates;
                    const totalItems = duplicates.length;
                    let processedItems = 0;

                    if (totalItems === 0) {
                        $statusMessage.text('No duplicates found.');
                        $progressBar.width('100%');
                        $progressPercent.text('100%');
                        $debugLog.show().append('No duplicates found.\n');
                        return;
                    }

                    isProcessing = true;

                    duplicates.forEach((pair, index) => {
                        setTimeout(() => {
                            processedItems++;
                            const progress = Math.round((processedItems / totalItems) * 100);
                            $progressBar.width(progress + '%');
                            $progressPercent.text(progress + '%');

                            if (index === 0) {
                                $results.append('<table class="widefat fixed"><thead><tr><th>Draft/Pending Post</th><th>Published Post</th></tr></thead><tbody></tbody></table>');
                            }
                            const $tbody = $results.find('tbody');
                            $tbody.append(`<tr>
                                <td><a href="${pair.draft_or_pending.link}" target="_blank">${pair.draft_or_pending.title} (${pair.draft_or_pending.status})</a></td>
                                <td><a href="${pair.published.link}" target="_blank">${pair.published.title}</a></td>
                            </tr>`);

                            if (processedItems === totalItems) {
                                $statusMessage.text('Duplicate check complete!');
                                $debugLog.show().append('Duplicate check complete.\n');
                            }
                        }, index * 100);
                    });
                } else {
                    $statusMessage.text('Error: ' + (response.data || 'Unknown error.')).css('color', 'red');
                    $debugLog.show().append('Error: ' + (response.data || 'Unknown error.') + '\n');
                }
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                clearTimeout(timeout); // Clear timeout on failure
                const errorMessage = 'AJAX request failed: ' + textStatus + ' (' + errorThrown + ')';
                $statusMessage.text(errorMessage).css('color', 'red');
                $debugLog.show().append(errorMessage + '\n');
                console.error(jqXHR.responseText);
            });
    });
});
