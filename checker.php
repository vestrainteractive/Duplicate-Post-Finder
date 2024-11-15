<?php
/**
 * Plugin Name: Draft and Duplicate Post Checker
 * Description: Displays draft and pending posts alongside published posts that appear to be duplicates, with options for multi-select and bulk actions.
 * Version: 1.1
 * Author: Vestra Interactive
 */

if (!defined('ABSPATH')) {
    exit;
}

class DraftDuplicatePostChecker {
    public function __construct() {
        add_action('admin_menu', [$this, 'add_admin_page']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_scripts']);
    }

    public function add_admin_page() {
        add_menu_page(
            'Draft and Duplicate Posts',
            'Post Duplicates',
            'manage_options',
            'draft-duplicate-posts',
            [$this, 'render_admin_page'],
            'dashicons-search',
            20
        );
    }

    public function enqueue_scripts($hook) {
        if ($hook === 'toplevel_page_draft-duplicate-posts') {
            wp_enqueue_script('jquery');
            wp_enqueue_script('wp-util');
            wp_enqueue_script('draft-duplicate-checker', plugin_dir_url(__FILE__) . 'checker.js', ['jquery', 'wp-util'], '1.1', true);
            wp_enqueue_style('draft-duplicate-checker-style', plugin_dir_url(__FILE__) . 'checker.css');
        }
    }

    public function render_admin_page() {
        ?>
        <div class="wrap">
            <h1>Draft, Pending, and Duplicate Post Checker</h1>
            <button id="check-duplicates" class="button button-primary">Check Duplicates</button>
            <div id="status-bar" style="display:none; margin-top: 20px;">
                <div class="spinner" style="float: left; margin-right: 10px;"></div>
                <span id="status-message">Checking for duplicates...</span>
            </div>
            <div id="duplicate-results" style="margin-top: 20px;"></div>
        </div>
        <?php
    }
}

new DraftDuplicatePostChecker();

// AJAX handler to retrieve duplicate posts.
add_action('wp_ajax_check_duplicates', 'check_duplicates_ajax_handler');

function check_duplicates_ajax_handler() {
    global $wpdb;

    $draft_and_pending_posts = get_posts([
        'post_type'   => 'post',
        'post_status' => ['draft', 'pending'],
        'numberposts' => -1,
    ]);

    $published_posts = get_posts([
        'post_type'   => 'post',
        'post_status' => 'publish',
        'numberposts' => -1,
    ]);

    $duplicates = [];

    foreach ($draft_and_pending_posts as $draft_or_pending) {
        foreach ($published_posts as $published) {
            // Check for duplicates by title or content similarity
            if (strcasecmp($draft_or_pending->post_title, $published->post_title) === 0 ||
                similar_text($draft_or_pending->post_content, $published->post_content, $percent) && $percent > 90) {
                $duplicates[] = [
                    'draft_or_pending' => $draft_or_pending,
                    'published' => $published,
                ];
            }
        }
    }

    wp_send_json_success(['duplicates' => $duplicates]);
}
