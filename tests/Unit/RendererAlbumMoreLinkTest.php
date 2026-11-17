<?php

declare( strict_types=1 );

namespace JZSA\Tests\Unit;

use JZSA_Renderer;
use PHPUnit\Framework\TestCase;

/**
 * album-more-link: a notice with a link to the album when it holds more items than are shown.
 */
class RendererAlbumMoreLinkTest extends TestCase {

	private const TEXT = 'Showing {items} of {total-items} items. View the whole album in {source}';

	private function render( array $config ): string {
		return ( new JZSA_Renderer() )->render(
			$config + array(
				'mode'                  => 'gallery',
				'album-url'             => 'https://photos.google.com/share/AAA?key=k',
				'photos'                => array_fill( 0, 3, 'a' ),
				'album-more-link'       => self::TEXT,
				'album-total-count'     => 368,
				'album-available-count' => 300,
			)
		);
	}

	public function test_notice_above_and_below_the_gallery_when_the_album_has_more_items(): void {
		$html = $this->render( array() );

		$this->assertStringContainsString(
			'<p class="jzsa-album-more-link jzsa-album-more-link-top"><a href="https://photos.google.com/share/AAA?key=k" target="_blank" rel="noopener noreferrer">Showing 3 of 368 items. View the whole album in Google Photos</a></p>',
			$html
		);
		$this->assertStringContainsString( 'jzsa-album-more-link-bottom', $html );
		$gallery = strpos( $html, 'jzsa-gallery-album' );
		$this->assertLessThan( $gallery, strpos( $html, 'jzsa-album-more-link-top' ) );
		$this->assertGreaterThan( $gallery, strpos( $html, 'jzsa-album-more-link-bottom' ) );
	}

	public function test_position_top_or_bottom_only(): void {
		$top = $this->render( array( 'album-more-link-position' => 'top' ) );
		$this->assertStringContainsString( 'jzsa-album-more-link-top', $top );
		$this->assertStringNotContainsString( 'jzsa-album-more-link-bottom', $top );

		$bottom = $this->render( array( 'mode' => 'slider', 'album-more-link-position' => 'bottom' ) );
		$this->assertStringNotContainsString( 'jzsa-album-more-link-top', $bottom );
		$this->assertStringContainsString( 'jzsa-album-more-link-bottom', $bottom );
	}

	public function test_no_notice_when_everything_is_shown_or_unknown(): void {
		$this->assertStringNotContainsString( 'jzsa-album-more-link', $this->render( array( 'album-total-count' => 300 ) ) );
		$this->assertStringNotContainsString( 'jzsa-album-more-link', $this->render( array( 'album-total-count' => null ) ) );
	}

	public function test_no_notice_when_the_site_set_limit_or_turned_it_off(): void {
		$this->assertStringNotContainsString( 'jzsa-album-more-link', $this->render( array( 'limit-explicit' => true ) ) );
		$this->assertStringNotContainsString( 'jzsa-album-more-link', $this->render( array( 'album-more-link' => '' ) ) );
	}
}
