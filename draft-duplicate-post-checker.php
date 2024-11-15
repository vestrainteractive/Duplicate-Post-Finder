<?php
/**
 * Plugin Name: Draft and Duplicate Post Checker
 * Description: A WordPress plugin to display draft, pending, and duplicate published posts side by side with a progress bar.
 * Version: 1.2
 * Author: Vestra Interactive
 */

if (!defined('ABSPATH')) {
    exit;
}

class DraftDuplicatePostChecker {
    public function __construct() {
        add_action('admin_menu', [$this, 'register_menu']);
        add_action('wp_ajax_check_duplicates', [$this, 'check_duplicates']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_scripts']);
    }

    public function register_menu() {
        add_menu_page(
            'Post Duplicates',
            'Post Duplicates',
            'edit_posts',
            'post-duplicates',
            [$this, 'render_admin_page'],
            'dashicons-search'
        );
    }

    public function render_admin_page() {
        ?>
        <div class="wrap">
            <h1>Draft, Pending, and Duplicate Post Checker</h1>
            <p>Click the button below to check for duplicate posts.</p>
            <button id="check-duplicates" class="button button-primary">Check Duplicates</button>
            <div id="status-bar" style="display: none;">
                <div id="progress-bar"></div>
                <span id="progress-percent"></span>
            </div>
            <div id="status-message"></div>
            <div id="duplicate-results"></div>
            <pre id="debug-log" style="background: #f4f4f4; padding: 10px; border: 1px solid #ccc; display: none; max-height: 300px; overflow-y: auto;"></pre>
        </div>
        <?php
    }

    public function enqueue_scripts($hook) {
        if ($hook === 'toplevel_page_post-duplicates') {
            wp_enqueue_script('checker-script', plugin_dir_url(__FILE__) . 'checker.js', ['jquery'], '1.2', true);
            wp_enqueue_style('checker-style', plugin_dir_url(__FILE__) . 'checker.css', [], '1.2');
            wp_localize_script('checker-script', 'checker_vars', [
                'ajax_url' => admin_url('admin-ajax.php'),
            ]);
        }
    }

    public function check_duplicates() {
        if (!current_user_can('edit_posts')) {
            wp_send_json_error('Permission denied.');
        }

        try {
            $posts = get_posts([
                'post_status' => ['draft', 'pending', 'publish'],
                'posts_per_page' => -1,
            ]);

            if (empty($posts)) {
                wp_send_json_error('No posts found.');
            }

            $duplicates = [];
            $published_posts = [];

            foreach ($posts as $post) {
                if ($post->post_status === 'publish') {
                    $published_posts[$post->post_title][] = $post;
                }
            }

            foreach ($posts as $post) {
                if (in_array($post->post_status, ['draft', 'pending'])) {
                    $title = $post->post_title;

                    if (!empty($published_posts[$title])) {
                        foreach ($published_posts[$title] as $published) {
                            $duplicates[] = [
                                'draft_or_pending' => [
                                    'title' => $post->post_title,
                                    'status' => ucfirst($post->post_status),
                                    'link' => get_edit_post_link($post->ID),
                                ],
                                'published' => [
                                    'title' => $published->post_title,
                                    'link' => get_permalink($published->ID),
                                ],
                            ];
                        }
                    }
                }
            }

            wp_send_json_success(['duplicates' => $duplicates]);
        } catch (Exception $e) {
            error_log('Error in check_duplicates: ' . $e->getMessage());
            wp_send_json_error('An error occurred: ' . $e->getMessage());
        }
    }
}

new DraftDuplicatePostChecker();
