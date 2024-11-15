jQuery(document).ready(function ($) {
    $('#check-duplicates').on('click', function () {
        const $results = $('#duplicate-results');
        const $statusBar = $('#status-bar');
        const $statusMessage = $('#status-message');

        $results.empty();
        $statusBar.show();
        $statusMessage.text('Checking for duplicates...');

        $.post(ajaxurl, { action: 'check_duplicates' }, function (response) {
            $statusBar.hide();

            if (response.success) {
                const duplicates = response.data.duplicates;
                if (duplicates.length) {
                    let html = '<table class="widefat fixed"><thead><tr><th>Draft/Pending Post</th><th>Published Post</th></tr></thead><tbody>';
                    duplicates.forEach(pair => {
                        html += `<tr>
                            <td>
                                <a href="${pair.draft_or_pending.link}" target="_blank">${pair.draft_or_pending.title} (${pair.draft_or_pending.status})</a>
                            </td>
                            <td>
                                <a href="${pair.published.link}" target="_blank">${pair.published.title}</a>
                            </td>
                        </tr>`;
                    });
                    html += '</tbody></table>';
                    $results.html(html);
                } else {
                    $results.html('<p>No duplicates found.</p>');
                }
            } else {
                $results.html('<p>Error fetching duplicates.</p>');
            }
        });
    });
});
