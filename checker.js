jQuery(document).ready(function ($) {
    $('#check-duplicates').on('click', function () {
        const $results = $('#duplicate-results');
        $results.html('<p>Loading...</p>');

        $.post(ajaxurl, { action: 'check_duplicates' }, function (response) {
            if (response.success) {
                const duplicates = response.data.duplicates;
                if (duplicates.length) {
                    let html = '<table class="widefat fixed"><thead><tr><th>Draft Post</th><th>Published Post</th></tr></thead><tbody>';
                    duplicates.forEach(pair => {
                        html += `<tr>
                            <td>
                                <a href="${pair.draft.edit_link}" target="_blank">${pair.draft.post_title}</a>
                            </td>
                            <td>
                                <a href="${pair.published.edit_link}" target="_blank">${pair.published.post_title}</a>
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
