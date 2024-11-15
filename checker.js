function check_duplicates() {
    // For debugging purposes
    error_log('Starting duplicate check...');

    // Get drafts and pending posts
    $args = array(
        'post_type' => 'post',
        'post_status' => array('draft', 'pending'),
        'posts_per_page' => -1,  // Retrieve all drafts and pending posts
    );

    $posts_query = new WP_Query($args);

    if (!$posts_query->have_posts()) {
        error_log('No drafts or pending posts found.');
        wp_send_json_error('No drafts or pending posts found.');
    }

    $duplicates = array();
    $posts_data = [];

    // Collect post data
    while ($posts_query->have_posts()) {
        $posts_query->the_post();
        $posts_data[] = array(
            'ID' => get_the_ID(),
            'title' => get_the_title(),
            'link' => get_the_permalink(),
            'status' => get_post_status(),
            'content' => get_the_content(),
        );
    }

    // Check for duplicates
    foreach ($posts_data as $draft_post) {
        foreach ($posts_data as $published_post) {
            if ($draft_post['ID'] !== $published_post['ID'] && $draft_post['content'] === $published_post['content']) {
                $duplicates[] = array(
                    'draft_or_pending' => $draft_post,
                    'published' => $published_post,
                );
            }
        }
    }

    wp_send_json_success(array('duplicates' => $duplicates));
}
add_action('wp_ajax_check_duplicates', 'check_duplicates');
