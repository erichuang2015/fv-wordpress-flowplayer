('use strict');
var FVFP_sStoreRTMP = 0;   
var FVFP_sWidgetId;

var fv_wp_flowplayer_content;
var fv_wp_flowplayer_hTinyMCE;
var fv_wp_flowplayer_oEditor;
var fv_wp_fp_shortcode_remains;
var fv_player_playlist_item_template;
var fv_player_playlist_video_template;
var fv_player_playlist_subtitles_template;
var fv_player_playlist_subtitles_box_template;
var fv_wp_fp_shortcode;
var fv_player_preview_single = -1;
var fv_player_preview_window;



var fv_player_shortcode_preview_unsupported = false;

jQuery(document).ready(function($){
  
  var ua = window.navigator.userAgent;
  fv_player_shortcode_preview_unsupported = ua.match(/edge/i) || ua.match(/safari/i) && !ua.match(/chrome/i) ;
  
  if( jQuery().fv_player_box ) {
    $(document).on( 'click', '.fv-wordpress-flowplayer-button', function(e) {
      e.preventDefault();
      $.fv_player_box( {
        top: "100px",
        initialWidth: 1100,
        initialHeight: 50,
        width:"1100px",
        height:"100px",
        href: "#fv-player-shortcode-editor",
        inline: true,
        title: 'Add FV Player',
        onComplete : fv_wp_flowplayer_edit,
        onClosed : fv_wp_flowplayer_on_close,
        onOpen: function(){
          jQuery("#fv_player_box").addClass("fv-flowplayer-shortcode-editor");
          jQuery("#cboxOverlay").addClass("fv-flowplayer-shortcode-editor");
        }
      } );
      FVFP_sWidgetId = $(this).data().number;
    });
    
  }
  /* 
   * NAV TABS 
   */
  $('.fv-player-tabs-header a').click( function(e) {
    e.preventDefault();
    $('.fv-player-tabs-header a').removeClass('nav-tab-active');
    $(this).addClass('nav-tab-active')
    $('.fv-player-tabs > .fv-player-tab').hide();
    $('.' + $(this).data('tab')).show();

    fv_wp_flowplayer_dialog_resize();
  });
  
  /* 
   * Select playlist item 
   * keywords: select item
   */
  $(document).on('click','.fv-player-tab-playlist tr td', function(e) {
    var new_index = $(this).parents('tr').index();
    
    fv_player_preview_single = new_index;
    
    jQuery('.fv-player-tabs-header .nav-tab').attr('style',false);    
   
    $('a[data-tab=fv-player-tab-video-files]').click();    
    
    $('.fv-player-tab-video-files table').hide();
    var video_tab = $('.fv-player-tab-video-files table').eq(new_index).show();
    
    $('.fv-player-tab-subtitles table').hide();
    var subtitles_tab = $('.fv-player-tab-subtitles table').eq(new_index).show();
    

    if($('.fv-player-tab-playlist [data-index]').length > 1){
      $('.fv-player-playlist-item-title').html('Playlist item no. ' + ++new_index);
      $('.playlist_edit').html($('.playlist_edit').data('edit')).removeClass('button').addClass('button-primary');
      jQuery('#fv-player-shortcode-editor-editor').attr('class','is-playlist');
    }else{
      $('.playlist_edit').html($('.playlist_edit').data('create')).removeClass('button-primary').addClass('button');
      jQuery('#fv-player-shortcode-editor-editor').attr('class','is-singular');
    }
    
    if($('.fv_wp_flowplayer_field_rtmp_path',video_tab).val().length === 0 && $('.fv_wp_flowplayer_field_rtmp',video_tab).val().length === 0){
      $('.fv_wp_flowplayer_field_rtmp_wrapper',video_tab).hide();
      $('.add_rtmp_wrapper',video_tab).show();
    }else{
      $('.fv_wp_flowplayer_field_rtmp_wrapper',video_tab).show();
      $('.add_rtmp_wrapper',video_tab).hide();
    }
    if(new_index > 1){
      $('.fv_wp_flowplayer_field_rtmp',video_tab).val($('.fv_wp_flowplayer_field_rtmp',$('.fv-player-tab-video-files table').eq(0)).val());
      $('.fv_wp_flowplayer_field_rtmp',video_tab).attr('readonly',true);
    }
     
    
    
    
    /*
     * temporary untill we fix multilang subs for playlist
     */
    if( !fv_flowplayer_conf.new_shortcode && new_index > 1){
      $('.fv_wp_flowplayer_field_subtitles_lang, .fv_flowplayer_language_add_link').hide();
    }else{
      $('.fv_wp_flowplayer_field_subtitles_lang, .fv_flowplayer_language_add_link').attr('style',false);
    }
      
    fv_player_refresh_tabs();
    
    fv_wp_flowplayer_submit(true);
  });

  $(document).on('input','.fv_wp_flowplayer_field_width', function(e) {
    $('.fv_wp_flowplayer_field_width').val(e.target.value);
  })
  $(document).on('input','.fv_wp_flowplayer_field_height', function(e) {
    $('.fv_wp_flowplayer_field_height').val(e.target.value);
  })
  /*
   * Playlist view thumbnail toggle
   */
  $('#fv-player-list-thumb-toggle > a').click(function(e){
    e.preventDefault();
    var button = $(e.currentTarget);
    if(button.hasClass('disabled')) return;
    $('#fv-player-list-thumb-toggle > a').removeClass('active');
    if(button.attr('id') === 'fv-player-list-list-view'){      
      $('.fv-player-tab-playlist').addClass('hide-thumbnails');
    }else{     
      $('.fv-player-tab-playlist').removeClass('hide-thumbnails');
    }
    button.addClass('active')
  })
  
  /* 
   * Remove playlist item 
   * keywords: delete playlist items remove playlist items
   */
  $(document).on('click','.fv-player-tab-playlist tr .fvp_item_remove', function(e) {
    e.stopPropagation();
    var
      $parent = $(e.target).parents('[data-index]'),
      index = $parent.attr('data-index'),
      id = $('.fv-player-tab-video-files table[data-index=' + index + ']').attr('data-id_video'),
      $deleted_videos_element = $('#deleted_videos');

    if (id && $deleted_videos_element.val()) {
      $deleted_videos_element.val($deleted_videos_element.val() + ',' + id);
    } else {
      $deleted_videos_element.val(id);
    }

    $parent.remove();
    jQuery('.fv-player-tab-video-files table[data-index=' + index + ']').remove();
    jQuery('.fv-player-tab-subtitles table[data-index=' + index + ']').remove();
    if(!jQuery('.fv-player-tab-subtitles table[data-index]').length){
      fv_flowplayer_playlist_add();
      jQuery('.fv-player-tab-playlist tr td').click();
    }
    
    fv_wp_flowplayer_submit('refresh-button');
  });
  
  /*
   *  Sort playlist  
   */
  $('.fv-player-tab-playlist table tbody').sortable({
    start: function( event, ui ) {
      FVFP_sStoreRTMP = jQuery('#fv-flowplayer-playlist table:first .fv_wp_flowplayer_field_rtmp').val();
    },
    update: function( event, ui ) {    
      var items = []; 
      $('.fv-player-tab-playlist table tbody tr').each(function(){
        var index = $(this).data('index');
        items.push({
          items : jQuery('.fv-player-tab-video-files table[data-index=' + index + ']').clone(),
          subs : jQuery('.fv-player-tab-subtitles table[data-index=' + index + ']').clone(),
        })
        jQuery('.fv-player-tab-video-files table[data-index=' + index + ']').remove();
        jQuery('.fv-player-tab-subtitles table[data-index=' + index + ']').remove();
      })
      
      for(var  i in items){
        if(!items.hasOwnProperty(i))continue;
        jQuery('.fv-player-tab-video-files').append(items[i].items);
        jQuery('.fv-player-tab-subtitles').append(items[i].subs);
      }
     
      jQuery('#fv-flowplayer-playlist table:first .fv_wp_flowplayer_field_rtmp').val( FVFP_sStoreRTMP );
      
      fv_wp_flowplayer_submit('refresh-button');      
    },
    axis: 'y',
    //handle: '.fvp_item_sort',
    containment: ".fv-player-tab-playlist"
  });
  
  /*
   * Uploader 
   */
  var fv_flowplayer_uploader;
  var fv_flowplayer_uploader_button;

  $(document).on( 'click', '#fv-player-shortcode-editor .button.add_media', function(e) {
      e.preventDefault();
      
      fv_flowplayer_uploader_button = jQuery(this);
      jQuery('.fv_flowplayer_target').removeClass('fv_flowplayer_target' );
      fv_flowplayer_uploader_button.siblings('input[type=text]').addClass('fv_flowplayer_target' );
                       
      //If the uploader object has already been created, reopen the dialog
      if (fv_flowplayer_uploader) {
          fv_flowplayer_uploader.open();
          return;
      }

      //Extend the wp.media object
      fv_flowplayer_uploader = wp.media.frames.file_frame = wp.media({
          title: 'Add Video',
          button: {
              text: 'Choose'
          },
          multiple: false
      });
      
      fv_flowplayer_uploader.on('open', function() {
        jQuery('.media-router .media-menu-item').eq(0).click();
        jQuery('.media-frame-title h1').text(fv_flowplayer_uploader_button.text());
      });      

      //When a file is selected, grab the URL and set it as the text field's value
      fv_flowplayer_uploader.on('select', function() {
          attachment = fv_flowplayer_uploader.state().get('selection').first().toJSON();

          $('.fv_flowplayer_target').val(attachment.url);
          $('.fv_flowplayer_target').removeClass('fv_flowplayer_target' );
        
          if( attachment.type == 'video' ) {
            if( typeof(attachment.width) != "undefined" && attachment.width > 0 ) {
              $('#fv_wp_flowplayer_field_width').val(attachment.width);
            }
            if( typeof(attachment.height) != "undefined" && attachment.height > 0 ) {
              $('#fv_wp_flowplayer_field_height').val(attachment.height);
            }
            if( typeof(attachment.fileLength) != "undefined" ) {
              $('#fv_wp_flowplayer_file_info').show();
              $('#fv_wp_flowplayer_file_duration').html(attachment.fileLength);
            }
            if( typeof(attachment.filesizeHumanReadable) != "undefined" ) {
              $('#fv_wp_flowplayer_file_info').show();
              $('#fv_wp_flowplayer_file_size').html(attachment.filesizeHumanReadable);
            }
            
          } else if( attachment.type == 'image' && typeof(fv_flowplayer_set_post_thumbnail_id) != "undefined" ) {
            if( jQuery('#remove-post-thumbnail').length > 0 ){
              return;
            }
            jQuery.post(ajaxurl, {
                action:"set-post-thumbnail",
                post_id: fv_flowplayer_set_post_thumbnail_id,
                thumbnail_id: attachment.id,
                 _ajax_nonce: fv_flowplayer_set_post_thumbnail_nonce,
                cookie: encodeURIComponent(document.cookie)
              }, function(str){
                var win = window.dialogArguments || opener || parent || top;
                if ( str == '0' ) {
                  alert( setPostThumbnailL10n.error );
                } else {
                  jQuery('#postimagediv .inside').html(str);
                  jQuery('#postimagediv .inside #plupload-upload-ui').hide();
                }
              } );
            
          }
          
          fv_wp_flowplayer_submit('refresh-button');
      });

      //Open the uploader dialog
      fv_flowplayer_uploader.open();

  });
  
  fv_player_playlist_item_template = jQuery('.fv-player-tab-playlist table tbody tr').parent().html();
  fv_player_playlist_video_template = jQuery('.fv-player-tab-video-files table.fv-player-playlist-item').parent().html();
  fv_player_playlist_subtitles_template = jQuery('.fv-fp-subtitle').parent().html();
  fv_player_playlist_subtitles_box_template = jQuery('.fv-player-tab-subtitles').html();


  /*
   * Preview
   */
  jQuery(document).on('input', '.fv-player-tabs [name][data-live-update!=false]' ,function(){
    if( !fv_player_shortcode_preview_unsupported && jQuery('.fv-player-tab-playlist tr').length < 10 ){
      jQuery('#fv-player-shortcode-editor-preview-iframe-refresh').show();
    }
  });
  
  var fv_player_shortcode_click_element = null;
  jQuery(document).mousedown(function(e) {
      fv_player_shortcode_click_element = jQuery(e.target);
  });
  
  jQuery(document).mouseup(function(e) {
      fv_player_shortcode_click_element = null;
  });
  
  jQuery(document).on('blur', '.fv-player-tabs [name][data-live-update!=false]' ,function(){
    if( fv_player_shortcode_click_element && fv_player_shortcode_click_element.hasClass('button-primary') ) {
      return;
    }
    
    fv_wp_flowplayer_submit('refresh-button');
  });
  
  jQuery(document).on('keypress', '.fv-player-tabs [name][data-live-update!=false]' ,function(e){
    if(e.key === 'Enter') {
      fv_wp_flowplayer_submit(true);
    }
  });
  
  jQuery('#fv-player-shortcode-editor-preview-iframe-refresh').click(function(){
    jQuery('#fv-player-shortcode-editor-preview-iframe-refresh').hide();
    
    fv_wp_flowplayer_submit(true);
  });
  
  /*
   * End of playlist Actions   
   */
 
  jQuery('#fv_wp_flowplayer_field_end_actions').change(function(){
    var value = jQuery(this).val();
    jQuery('.fv_player_actions_end-toggle').hide().find('[name]').val('');
    switch(value){
      case 'redirect': 
        jQuery('#fv_wp_flowplayer_field_' + value).parents('tr').show(); 
        break; 
      case 'popup':
        jQuery('#fv_wp_flowplayer_field_' + value).parents('tr').show();
        jQuery('#fv_wp_flowplayer_field_' + value + '_id').parents('tr').show();
        break;
      case 'email_list':
        jQuery('#fv_wp_flowplayer_field_' + value).parents('tr').show();
        break;
      default:        
        fv_wp_flowplayer_submit('refresh-button');
        break;
    }
  });
  
  /*
   * Preview iframe dialog resize
   */
  jQuery(document).on('fvp-preview-complete',function(e,width,height){
    fv_player_shortcode_preview = false;
    jQuery('#fv-player-shortcode-editor-preview').attr('class','preview-show');
    setTimeout(function(){
      fv_wp_flowplayer_dialog_resize();
    },0);
  });
  
  /*
   * Video share option
   */
 
  jQuery('#fv_wp_flowplayer_field_share').change(function(){
    var value = jQuery(this).val();
    
    switch(value){
      case 'Custom': 
        jQuery("#fv_wp_flowplayer_field_share_custom").show();
        break;
      default:        
        jQuery("#fv_wp_flowplayer_field_share_custom").hide();
        break;
    }
  });  
  
  
});



/*
 * Initializes shortcode, removes playlist items, hides elements
 */
function fv_wp_flowplayer_init() {
  fv_wp_flowplayer_dialog_resize_height_record = 0;
  fv_player_shortcode_preview = false;
  fv_player_shortcode_editor_last_url = false;
  
  if( jQuery('#widget-widget_fvplayer-'+FVFP_sWidgetId+'-text').length ){
    fv_wp_flowplayer_content = jQuery('#widget-widget_fvplayer-'+FVFP_sWidgetId+'-text').val();
  } else if( typeof(FCKeditorAPI) == 'undefined' && jQuery('#content:not([aria-hidden=true])').length){
    fv_wp_flowplayer_content = jQuery('#content:not([aria-hidden=true])').val();
  } else if( typeof tinymce !== 'undefined' && typeof tinymce.majorVersion !== 'undefined' && typeof tinymce.activeEditor !== 'undefined' && tinymce.majorVersion >= 4 ){
    fv_wp_flowplayer_hTinyMCE = tinymce.activeEditor;
  } else if( typeof tinyMCE !== 'undefined' ) {
    fv_wp_flowplayer_hTinyMCE = tinyMCE.getInstanceById('content');
  } else if(typeof(FCKeditorAPI) !== 'undefined' ){
    fv_wp_flowplayer_oEditor = FCKeditorAPI.GetInstance('content');
  }
  
  jQuery('#fv_wp_flowplayer_file_info').hide();
  jQuery(".fv_wp_flowplayer_field_src_2_wrapper").hide();
  jQuery("#fv_wp_flowplayer_field_src_2_uploader").hide();
  jQuery(".fv_wp_flowplayer_field_src_1_wrapper").hide();
  jQuery("#fv_wp_flowplayer_field_src_1_uploader").hide();
  jQuery("#add_format_wrapper").show();
  jQuery(".add_rtmp_wrapper").show(); 
  jQuery(".fv_wp_flowplayer_field_rtmp_wrapper").hide();
  jQuery('#fv-player-shortcode-editor-preview').attr('class','preview-no');
  
  jQuery('.fv-player-tab-video-files table').each( function(i,e) {
    if( i == 0 ) return;
    jQuery(e).remove();
  } );
  
  jQuery('.fv-player-tab-playlist table tbody tr').each( function(i,e) {
    if( i == 0 ) return;
    jQuery(e).remove();
  } );
  
  jQuery('.fv-player-tab-subtitles').html(fv_player_playlist_subtitles_box_template);
  
  jQuery('.fv_wp_flowplayer_field_subtitles_lang').val(0);

  /**
   * TABS 
   */ 
  jQuery('#fv-player-shortcode-editor a[data-tab=fv-player-tab-playlist]').hide();
  jQuery('#fv-player-shortcode-editor a[data-tab=fv-player-tab-video-files]').trigger('click');
  jQuery('.nav-tab').show;
  
  //hide empy tabs hide tabs
  jQuery('#fv-player-shortcode-editor-editor').attr('class','is-singular');
  jQuery('.fv-player-tab-playlist').hide();
  jQuery('.fv-player-playlist-item-title').html('');
  jQuery('.fv-player-tab-video-files table').show();
  
  jQuery('.playlist_edit').html(jQuery('.playlist_edit').data('create')).removeClass('button-primary').addClass('button');
  fv_player_refresh_tabs();
}

/*
 * Sends new shortcode to editor
 */
function fv_wp_flowplayer_insert( shortcode ) {
  if( typeof(FCKeditorAPI) == 'undefined' && jQuery('#content:not([aria-hidden=true])').length ) {
    fv_wp_flowplayer_content = fv_wp_flowplayer_content .replace(/#fvp_placeholder#/,shortcode);
    fv_wp_flowplayer_set_html( fv_wp_flowplayer_content );
  }else if( fv_wp_flowplayer_content.match( fv_wp_flowplayer_re_edit ) ) {
    fv_wp_flowplayer_content = fv_wp_flowplayer_content.replace( fv_wp_flowplayer_re_edit, shortcode )
    fv_wp_flowplayer_set_html( fv_wp_flowplayer_content );
  }
  else {
    if ( fv_wp_flowplayer_content != '' ) {
      fv_wp_flowplayer_content = fv_wp_flowplayer_content.replace( fv_wp_flowplayer_re_insert, shortcode )
      fv_wp_flowplayer_set_html( fv_wp_flowplayer_content );
    } else {
      fv_wp_flowplayer_content = shortcode;
      send_to_editor( shortcode );
    }
  }
}

/*
 * Removes playlist item 
 * keywords: remove palylist item
 */
function fv_wp_flowplayer_playlist_remove(link) {
  FVFP_sStoreRTMP = jQuery('#fv-flowplayer-playlist table:first .fv_wp_flowplayer_field_rtmp').val();
	jQuery(link).parents('table').remove();
  jQuery('#fv-flowplayer-playlist table:first .fv_wp_flowplayer_field_rtmp').val( FVFP_sStoreRTMP );
	return false;
}

/*
 * Adds playlist item
 * keywords: add playlist item
 */
function fv_flowplayer_playlist_add( sInput, sCaption, sSubtitles, sSplashText, sId ) {
  jQuery('.fv-player-tab-playlist table tbody').append(fv_player_playlist_item_template);
  var ids = jQuery('.fv-player-tab-playlist [data-index]').map(function() {
    return parseInt(jQuery(this).attr('data-index'), 10);
  }).get();  
  var newIndex = Math.max(Math.max.apply(Math, ids) + 1,0);
  var current = jQuery('.fv-player-tab-playlist table tbody tr').last();
  current.attr('data-index', newIndex);
  current.find('.fvp_item_video-filename').html( 'Video ' + (newIndex + 1) );
  
  jQuery('.fv-player-tab-video-files').append(fv_player_playlist_video_template);
  var new_item = jQuery('.fv-player-tab-video-files table:last');
  new_item.hide().attr('data-index', newIndex);

  if (typeof(sId) !== 'undefined') {
    new_item.attr('data-id_video', sId);
  }

  jQuery('.fv-player-tab-subtitles').append(fv_player_playlist_subtitles_box_template);
  var new_item_subtitles = jQuery('.fv-player-tab-subtitles table:last');
  new_item_subtitles.hide().attr('data-index', newIndex);
  
  //jQuery('.fv-player-tab-video-files table').hover( function() { jQuery(this).find('.fv_wp_flowplayer_playlist_remove').show(); }, function() { jQuery(this).find('.fv_wp_flowplayer_playlist_remove').hide(); } );

  if( sInput ) {
    var aInput = sInput.split(',');
    var count = 0;
    for( var i in aInput ) {
      if( aInput[i].match(/^rtmp:/) ) {
        new_item.find('.fv_wp_flowplayer_field_rtmp_path').val(aInput[i].replace(/^rtmp:/,''));
      } else if( aInput[i].match(/\.(jpg|png|gif|jpe|jpeg)(?:\?.*?)?$/) ) {
        new_item.find('.fv_wp_flowplayer_field_splash').val(aInput[i]);      
      } else {
        if( count == 0 ) {
          new_item.find('#fv_wp_flowplayer_field_src').val(aInput[i]);
        } else {
          new_item.find('#fv_wp_flowplayer_field_src_'+count).val(aInput[i]);
        }
        count++;
      }
    }
    if( sCaption ) {
      jQuery('[name=fv_wp_flowplayer_field_caption]',new_item).val(sCaption);
    }
    if( sSubtitles ) {
      if (typeof sSubtitles === 'object' && sSubtitles.length && sSubtitles[0].lang) {
        // DB-based subtitles value
        var firstDone = false;

        for (var i in sSubtitles) {
          // add as many new subtitles as we have
          if (firstDone) {
            fv_flowplayer_language_add(sSubtitles[i].file, sSubtitles[i].lang, newIndex, sSubtitles[i].id);
          } else {
            var
              subElement = jQuery('[name=fv_wp_flowplayer_field_subtitles_lang]',new_item_subtitles),
              $parent = subElement.parent();

            subElement.val(sSubtitles[i].lang);
            $parent.attr('data-id_subtitles', sSubtitles[i].id);
            $parent.hover( function() { jQuery(this).find('.fv-fp-subtitle-remove').show(); }, function() { jQuery(this).find('.fv-fp-subtitle-remove').hide(); } );
            $parent.find('.fv-fp-subtitle-remove').click(fv_flowplayer_remove_subtitles);

            jQuery('[name=fv_wp_flowplayer_field_subtitles]',new_item_subtitles).val(sSubtitles[i].file);
            firstDone = true;
          }
        }
      } else {
        // shortcode-based subtitle value
        jQuery('[name=fv_wp_flowplayer_field_subtitles]', new_item_subtitles).val(sSubtitles);
      }
    }
    if( sSplashText ) {
      // if sSplashText is an object, we fill both, splash image and text,
      // otherwise we only use it as a text into the input
      // ... this is for compatibility reasons with old shortcodes
      if (typeof(sSplashText) == 'string') {
        jQuery('[name=fv_wp_flowplayer_field_splash_text]', new_item).val(sSplashText);
      } else {
        jQuery('[name=fv_wp_flowplayer_field_splash]', new_item).val(sSplashText.splash);
        jQuery('[name=fv_wp_flowplayer_field_splash_text]', new_item).val(sSplashText.splash_text);
      }
    }
  }
  
  fv_wp_flowplayer_dialog_resize(); 
  return new_item;
}

/*
 * Displays playlist editor
 * keywords: show playlist 
 */
function fv_flowplayer_playlist_show() {

  jQuery('#fv-player-shortcode-editor-editor').attr('class','is-playlist-active');
  jQuery('.fv-player-tabs-header .nav-tab').attr('style',false);
  jQuery('a[data-tab=fv-player-tab-playlist]').click();
  
  fv_player_preview_single = -1;
  
  //fills playlist edistor table from individual video tables
  var video_files = jQuery('.fv-player-tab-video-files table');
  video_files.each( function() {
    var current = jQuery(this);

    var currentUrl = current.find('#fv_wp_flowplayer_field_src').val();
    if(!currentUrl.length){
      currentUrl = 'Video ' + (jQuery(this).index() + 1);
    }
    var playlist_row = jQuery('.fv-player-tab-playlist table tbody tr').eq( video_files.index(current) );

    current.attr('data-index', current.index() );
    playlist_row.attr('data-index', current.index() );
    
    var video_preview = current.find('#fv_wp_flowplayer_field_splash').val();
    playlist_row.find('.fvp_item_video-thumbnail').html( video_preview.length ? '<img src="' + video_preview + '" />':'');
    playlist_row.find('.fvp_item_video-filename').html( currentUrl.split("/").pop() );
    
    playlist_row.find('.fvp_item_caption div').html( current.find('#fv_wp_flowplayer_field_caption').val() );
  });
  //initial indexing
  jQuery('.fv-player-tab.fv-player-tab-subtitles table').each(function(){
    jQuery(this).attr('data-index', jQuery(this).index() );
  })
  
  if(!jQuery('.fvp_item_video-thumbnail>img').length){
    jQuery('#fv-player-list-list-view').click();
    jQuery('#fv-player-list-thumb-view').addClass('disabled');
    jQuery('#fv-player-list-thumb-view').attr('title',jQuery('#fv-player-list-thumb-view').data('title'));
  }else{
    jQuery('#fv-player-list-thumb-view').click();
    jQuery('#fv-player-list-thumb-view').removeClass('disabled');
    jQuery('#fv-player-list-thumb-view').removeAttr('title');
  }
  
  jQuery('.fv-player-tab-playlist').show();
  fv_wp_flowplayer_dialog_resize();
  fv_player_refresh_tabs();
  fv_wp_flowplayer_submit(true);

  return false;
}

function fv_flowplayer_remove_subtitles() {
  if(jQuery(this).parents('.fv-fp-subtitles').find('.fv-fp-subtitle').length > 1){
    var
      $parent = jQuery(this).parents('.fv-fp-subtitle'),
      id = $parent.attr('data-id_subtitles')

    if (id) {
      fv_wp_delete_video_meta_record(id);
    }

    $parent.remove();
  }else{
    var
      $parent = jQuery(this).parents('.fv-fp-subtitle'),
      id = $parent.attr('data-id_subtitles')

    if (id) {
      fv_wp_delete_video_meta_record(id);
    }

    $parent.find('[name]').val('');
    $parent.removeAttr('data-id_subtitles');
  }
  fv_wp_flowplayer_dialog_resize();

  return false;
}

/*
 * Adds another language to subtitle menu
 */
function fv_flowplayer_language_add( sInput, sLang, iTabIndex, sId ) {
  if(!iTabIndex){
    var current = jQuery('.fv-player-tab-subtitles table:visible');
    iTabIndex = current.length && current.data('index') ? current.data('index') : 0;
  }
  var oTab = jQuery('.fv-fp-subtitles').eq(iTabIndex);
  oTab.append( fv_player_playlist_subtitles_template ); 

  var subElement = jQuery('.fv-fp-subtitle:last' , oTab);
  subElement.hover( function() { jQuery(this).find('.fv-fp-subtitle-remove').show(); }, function() { jQuery(this).find('.fv-fp-subtitle-remove').hide(); } );

  if (typeof(sId) !== 'undefined') {
    subElement.attr('data-id_subtitles', sId);
  }
  
  if( sInput ) {
    jQuery('.fv-fp-subtitle:last input.fv_wp_flowplayer_field_subtitles' , oTab ).val(sInput);
  }
  
  if ( sLang ) {
    jQuery('.fv-fp-subtitle:last select.fv_wp_flowplayer_field_subtitles_lang' , oTab).val(sLang);
  }
  
  jQuery('.fv-fp-subtitle:last .fv-fp-subtitle-remove' , oTab).click(fv_flowplayer_remove_subtitles);
  
  fv_wp_flowplayer_dialog_resize();
  return false;
}

/**
 * Performs all the magic to display a correct
 * shortcode editor dialog.
 *
 * @param shortcode The shortcode with parameters to display the dialog from.
 */
function do_shortcode_magic(shortcode) {
  shortcode = shortcode.replace(/^\[|]+$/gm,'');
  shortcode = shortcode.replace( fv_wp_flowplayer_re_insert, '' );

  shortcode = shortcode.replace( /\\'/g,'&#039;' );

  var shortcode_parse_fix = shortcode.replace(/(popup|ad)='[^']*?'/g, '');
  shortcode_parse_fix = shortcode_parse_fix.replace(/(popup|ad)="(.*?[^\\\\/])"/g, '');
  fv_wp_fp_shortcode_remains = shortcode_parse_fix.replace( /^\S+\s*?/, '' );

  var srcurl = fv_wp_flowplayer_shortcode_parse_arg( shortcode_parse_fix, 'src' );
  var srcurl1 = fv_wp_flowplayer_shortcode_parse_arg( shortcode, 'src1' );
  var srcurl2 = fv_wp_flowplayer_shortcode_parse_arg( shortcode, 'src2' );

  var srcrtmp = fv_wp_flowplayer_shortcode_parse_arg( shortcode, 'rtmp' );
  var srcrtmp_path = fv_wp_flowplayer_shortcode_parse_arg( shortcode, 'rtmp_path' );

  var iwidth = fv_wp_flowplayer_shortcode_parse_arg( shortcode_parse_fix, 'width' );
  var iheight = fv_wp_flowplayer_shortcode_parse_arg( shortcode_parse_fix, 'height' );

  var sad_skip = fv_wp_flowplayer_shortcode_parse_arg( shortcode, 'ad_skip' );
  var salign = fv_wp_flowplayer_shortcode_parse_arg( shortcode, 'align' );
  var scontrolbar = fv_wp_flowplayer_shortcode_parse_arg( shortcode, 'controlbar' );
  var sautoplay = fv_wp_flowplayer_shortcode_parse_arg( shortcode, 'autoplay' );
  var sliststyle = fv_wp_flowplayer_shortcode_parse_arg( shortcode, 'liststyle' );
  var sembed = fv_wp_flowplayer_shortcode_parse_arg( shortcode_parse_fix, 'embed' );
  var sloop = fv_wp_flowplayer_shortcode_parse_arg( shortcode, 'loop' );
  var slive = fv_wp_flowplayer_shortcode_parse_arg( shortcode, 'live' );
  var sshare = fv_wp_flowplayer_shortcode_parse_arg( shortcode, 'share', false, fv_wp_flowplayer_share_parse_arg );
  var sspeed = fv_wp_flowplayer_shortcode_parse_arg( shortcode, 'speed' );
  var ssplash = fv_wp_flowplayer_shortcode_parse_arg( shortcode, 'splash' );
  var ssplashend = fv_wp_flowplayer_shortcode_parse_arg( shortcode, 'splashend' );
  var ssticky = fv_wp_flowplayer_shortcode_parse_arg( shortcode, 'sticky' );

  var splaylist_advance = fv_wp_flowplayer_shortcode_parse_arg( shortcode, 'playlist_advance' );

  var ssubtitles = fv_wp_flowplayer_shortcode_parse_arg( shortcode, 'subtitles' );
  var aSubtitlesLangs = shortcode.match(/subtitles_[a-z][a-z]+/g);
  for( var i in aSubtitlesLangs ){  //  move
    fv_wp_flowplayer_shortcode_parse_arg( shortcode, aSubtitlesLangs[i], false, fv_wp_flowplayer_subtitle_parse_arg );
  }
  if(!aSubtitlesLangs){ //  move
    fv_flowplayer_language_add(false, false );
  }

  var smobile = fv_wp_flowplayer_shortcode_parse_arg( shortcode, 'mobile' );
  var sredirect = fv_wp_flowplayer_shortcode_parse_arg( shortcode, 'redirect' );

  var sCaptions = fv_wp_flowplayer_shortcode_parse_arg( shortcode, 'caption' );
  var sSplashText = fv_wp_flowplayer_shortcode_parse_arg( shortcode, 'splash_text' );
  var sPlaylist = fv_wp_flowplayer_shortcode_parse_arg( shortcode, 'playlist' );

  var sad = fv_wp_flowplayer_shortcode_parse_arg( shortcode, 'ad', true );
  var iadwidth = fv_wp_flowplayer_shortcode_parse_arg( shortcode, 'ad_width' );
  var iadheight = fv_wp_flowplayer_shortcode_parse_arg( shortcode, 'ad_height' );


  if( srcrtmp != null && srcrtmp[1] != null ) {
    jQuery(".fv_wp_flowplayer_field_rtmp").val( srcrtmp[1] );
    jQuery(".fv_wp_flowplayer_field_rtmp_wrapper").show();
    jQuery(".add_rtmp_wrapper").hide();
  }
  if( srcrtmp_path != null && srcrtmp_path[1] != null ) {
    jQuery(".fv_wp_flowplayer_field_rtmp_path").val( srcrtmp_path[1] );
    jQuery(".fv_wp_flowplayer_field_rtmp_wrapper").show();
    jQuery(".add_rtmp_wrapper").hide();
  }
  var playlist_row = jQuery('.fv-player-tab-playlist tbody tr:first')

  if( srcurl != null && srcurl[1] != null )
    document.getElementById("fv_wp_flowplayer_field_src").value = srcurl[1];
  if( srcurl1 != null && srcurl1[1] != null ) {
    document.getElementById("fv_wp_flowplayer_field_src_1").value = srcurl1[1];
    jQuery(".fv_wp_flowplayer_field_src_1_wrapper").css( 'display', 'table-row' );
    //document.getElementById("fv_wp_flowplayer_field_src_1_uploader").style.display = 'table-row';
    if( srcurl2 != null && srcurl2[1] != null ) {
      document.getElementById("fv_wp_flowplayer_field_src_2").value = srcurl2[1];
      jQuery(".fv_wp_flowplayer_field_src_2_wrapper").css( 'display', 'table-row' );
      //document.getElementById("fv_wp_flowplayer_field_src_2_uploader").style.display = 'table-row';
      document.getElementById("add_format_wrapper").style.display = 'none';
    }
  }

  if( srcurl != null && srcurl[1] != null ) {
    document.getElementById("fv_wp_flowplayer_field_src").value = srcurl[1];
    playlist_row.find('.fvp_item_video-filename').html( srcurl[1] );
  }

  jQuery('.fv_wp_flowplayer_field_width').val(iwidth[1] || '');
  jQuery('.fv_wp_flowplayer_field_height').val(iheight[1] || '');


  if( sautoplay != null && sautoplay[1] != null ) {
    if (sautoplay[1] == 'true')
      document.getElementById("fv_wp_flowplayer_field_autoplay").selectedIndex = 1;
    if (sautoplay[1] == 'false')
      document.getElementById("fv_wp_flowplayer_field_autoplay").selectedIndex = 2;
  }
  if( sliststyle != null && sliststyle[1] != null ) {
    var objPlaylistStyle = document.getElementById("fv_wp_flowplayer_field_playlist");
    if (sliststyle[1] == 'tabs') objPlaylistStyle.selectedIndex = 1;
    if (sliststyle[1] == 'prevnext') objPlaylistStyle.selectedIndex = 2;
    if (sliststyle[1] == 'vertical') objPlaylistStyle.selectedIndex = 3;
    if (sliststyle[1] == 'horizontal') objPlaylistStyle.selectedIndex = 4;
    if (sliststyle[1] == 'text') objPlaylistStyle.selectedIndex = 5;
    if (sliststyle[1] == 'slider') objPlaylistStyle.selectedIndex = 6;
  }
  if( sembed != null && sembed[1] != null ) {
    if (sembed[1] == 'true')
      document.getElementById("fv_wp_flowplayer_field_embed").selectedIndex = 1;
    if (sembed[1] == 'false')
      document.getElementById("fv_wp_flowplayer_field_embed").selectedIndex = 2;
  }
  if( smobile != null && smobile[1] != null )
    document.getElementById("fv_wp_flowplayer_field_mobile").value = smobile[1];

  if( ssplash != null && ssplash[1] != null ) {
    document.getElementById("fv_wp_flowplayer_field_splash").value = ssplash[1];
    playlist_row.find('.fvp_item_splash').html( '<img width="120" src="'+ssplash[1]+'" />' );
  }

  var aSubtitles = false;
  if( ssubtitles != null && ssubtitles[1] != null ) {
    aSubtitles = ssubtitles[1].split(';');
    jQuery(".fv_wp_flowplayer_field_subtitles").eq(0).val( aSubtitles[0] );
    aSubtitles.shift();  //  the first item is no longer needed for playlist parsing which will follow
  }

  if( ssticky != null && ssticky[1] != null ) {
    if (ssticky[1] == 'true')
      document.getElementById("fv_wp_flowplayer_field_sticky").selectedIndex = 1;
    if (ssticky[1] == 'false')
      document.getElementById("fv_wp_flowplayer_field_sticky").selectedIndex = 2;
  }

  if( sad != null && sad[1] != null ) {
    sad = sad[1].replace(/&#039;/g,'\'').replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
    sad = sad.replace(/&amp;/g,'&');
    document.getElementById("fv_wp_flowplayer_field_ad").value = sad;
  }
  if( iadheight != null && iadheight[1] != null )
    document.getElementById("fv_wp_flowplayer_field_ad_height").value = iadheight[1];
  if( iadwidth != null && iadwidth[1] != null )
    document.getElementById("fv_wp_flowplayer_field_ad_width").value = iadwidth[1];
  if( sad_skip != null && sad_skip[1] != null && sad_skip[1] == 'yes' )
    document.getElementById("fv_wp_flowplayer_field_ad_skip").checked = 1;
  if( slive != null && slive[1] != null && slive[1] == 'true' )
    document.getElementById("fv_wp_flowplayer_field_live").checked = 1;
  if( sspeed != null && sspeed[1] != null ) {
    if (sspeed[1] == 'buttons')
      document.getElementById("fv_wp_flowplayer_field_speed").selectedIndex = 1;
    if (sspeed[1] == 'no')
      document.getElementById("fv_wp_flowplayer_field_speed").selectedIndex = 2;
  }
  /*
  if( ssplashend != null && ssplashend[1] != null && ssplashend[1] == 'show' )
    document.getElementById("fv_wp_flowplayer_field_splashend").checked = 1;
  if( sloop != null && sloop[1] != null && sloop[1] == 'true' )
    document.getElementById("fv_wp_flowplayer_field_loop").checked = 1;
  if( sredirect != null && sredirect[1] != null )
    document.getElementById("fv_wp_flowplayer_field_redirect").value = sredirect[1];
  */

  if( sSplashText != null && sSplashText[1] != null ) {
    document.getElementById("fv_wp_flowplayer_field_splash_text").value = sSplashText[1];
  }


  /*
   * Video end dropdown
   */
  document.getElementById("fv_wp_flowplayer_field_popup").parentNode.style.display = 'none'
  var spopup = fv_wp_flowplayer_shortcode_parse_arg( shortcode, 'popup', true );

  if( sredirect != null && sredirect[1] != null ){
    document.getElementById("fv_wp_flowplayer_field_end_actions").selectedIndex = 1;
    document.getElementById("fv_wp_flowplayer_field_redirect").value = sredirect[1];
    jQuery('#fv_wp_flowplayer_field_redirect').parents('tr').show();
  }else if( sloop != null && sloop[1] != null && sloop[1] == 'true' ){
    document.getElementById("fv_wp_flowplayer_field_end_actions").selectedIndex = 2;
  }else if( spopup != null && spopup[1] != null ) {
    document.getElementById("fv_wp_flowplayer_field_end_actions").selectedIndex = 3;

    spopup = spopup[1].replace(/&#039;/g,'\'').replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
    spopup = spopup.replace(/&amp;/g,'&');

    jQuery("#fv_wp_flowplayer_field_popup_id").parents('tr').show();

    if (spopup === null || !isNaN(parseInt(spopup)) || spopup === 'no' || spopup === 'random' || spopup === 'email_list') {
      jQuery("#fv_wp_flowplayer_field_popup_id").val(spopup)
    } else if( spopup.match(/email-[0-9]*/)){
      jQuery("#fv_wp_flowplayer_field_popup_id").parent().parent().hide();
      jQuery("#fv_wp_flowplayer_field_email_list").parent().parent().show();
      jQuery("#fv_wp_flowplayer_field_end_actions").val('email_list');
      jQuery("#fv_wp_flowplayer_field_email_list").val(spopup.match(/email-([0-9]*)/)[1]);
    }else {
      jQuery("#fv_wp_flowplayer_field_popup").val(spopup).parent().show();
    }

  }else if( ssplashend != null && ssplashend[1] != null && ssplashend[1] == 'show' ){
    document.getElementById('fv_wp_flowplayer_field_end_actions').selectedIndex = 4
  }

  if( splaylist_advance != null && splaylist_advance[1] != null ) {
    if (splaylist_advance[1] == 'true')
      document.getElementById("fv_wp_flowplayer_field_playlist_advance").selectedIndex = 1;
    if (splaylist_advance[1] == 'false')
      document.getElementById("fv_wp_flowplayer_field_playlist_advance").selectedIndex = 2;
  }


  if( salign != null && salign[1] != null ) {
    if (salign[1] == 'left')
      document.getElementById("fv_wp_flowplayer_field_align").selectedIndex = 1;
    if (salign[1] == 'right')
      document.getElementById("fv_wp_flowplayer_field_align").selectedIndex = 2;
  }

  if( scontrolbar != null && scontrolbar[1] != null ) {
    if (scontrolbar[1] == 'yes' || scontrolbar[1] == 'show' )
      document.getElementById("fv_wp_flowplayer_field_controlbar").selectedIndex = 1;
    if (scontrolbar[1] == 'no' || scontrolbar[1] == 'hide' )
      document.getElementById("fv_wp_flowplayer_field_controlbar").selectedIndex = 2;
  }

  var aCaptions = false;
  if( sCaptions ) {
    aCaptions = fv_flowplayer_shortcode_editor_cleanup(sCaptions);

    var caption = aCaptions.shift();
    jQuery('[name=fv_wp_flowplayer_field_caption]',jQuery('.fv-player-playlist-item').eq(0)).val( caption );
    playlist_row.find('.fvp_item_caption div').html( caption );
  }

  var aSplashText = false;
  if( sSplashText ) {
    aSplashText = fv_flowplayer_shortcode_editor_cleanup(sSplashText);

    var splash_text = aSplashText.shift();
    jQuery('[name=fv_wp_flowplayer_field_splash_text]',jQuery('.fv-player-playlist-item').eq(0)).val( splash_text );
  }

  if( sPlaylist ) {
    // check for all-numeric playlist items separated by commas
    // which outlines video IDs from a database
    aPlaylist = sPlaylist[1].split(';');
    for (var i in aPlaylist) {
      fv_flowplayer_playlist_add(aPlaylist[i], aCaptions[i], aSubtitles[i], aSplashText[i]);
    }
  }

  if( jQuery('.fv-fp-subtitles .fv-fp-subtitle:first input.fv_wp_flowplayer_field_subtitles').val() == '' ) {
    jQuery('.fv-fp-subtitles .fv-fp-subtitle:first').remove();
  }

  jQuery(document).trigger('fv_flowplayer_shortcode_parse', [ shortcode_parse_fix, fv_wp_fp_shortcode_remains ] );

  jQuery(".fv_player_field_insert-button").attr( 'value', 'Update' );

  jQuery('.fv_wp_flowplayer_playlist_head').hover(
    function() { jQuery(this).find('.fv_wp_flowplayer_playlist_remove').show(); }, function() { jQuery(this).find('.fv_wp_flowplayer_playlist_remove').hide(); } );

  //???
  jQuery('#cboxContent').css('background','white');


  if(sPlaylist){
    fv_flowplayer_playlist_show();
  }
  //initial preview
  fv_player_refresh_tabs();

  fv_wp_flowplayer_submit(true);
}

function fv_wp_flowplayer_map_names_to_editor_fields(name) {
  var fieldMap = {
    'liststyle': 'playlist',
    'preroll': 'video_ads',
    'postroll': 'video_ads_post'
  };

  return 'fv_wp_flowplayer_field_' + (fieldMap[name] ? fieldMap[name] : name);
}

function fv_wp_flowplayer_map_db_values_to_field_values(name, value) {
  switch (name) {
    case 'playlist_advance':
      return ((value == 'true' || value == 'on') ? 'on' : (value == 'default' || value == '') ? 'default' : 'off');
      break;

    default: return value
  }
}

/*
 * removes previous values from editor
 * fills new values from shortcode
 */
function fv_wp_flowplayer_edit() {	

  var dialog = jQuery('#fv_player_box.fv-flowplayer-shortcode-editor');
  dialog.removeAttr('tabindex');
  
  fv_wp_flowplayer_init();

  // remove any DB data IDs that may be left in the form
  jQuery('#fv-player-shortcode-editor [data-id]').removeData('id').removeAttr('data-id');
  jQuery('#fv-player-shortcode-editor [data-id_video]').removeData('id_video').removeAttr('data-id_video');
  jQuery('#fv-player-shortcode-editor [data-id_subtitles]').removeData('id_subtitles').removeAttr('data-subtitles');

  // fire up editor reset event, so plugins can clear up their data IDs as well
  var $doc = jQuery(document);
  $doc.trigger('fv_flowplayer_player_editor_reset');

  jQuery("#fv-player-shortcode-editor input:not(.extra-field)").each( function() { jQuery(this).val( '' ); jQuery(this).attr( 'checked', false ) } );
  jQuery("#fv-player-shortcode-editor textarea").each( function() { jQuery(this).val( '' ) } );
  jQuery('#fv-player-shortcode-editor select').prop('selectedIndex',0);
  jQuery("[name=fv_wp_flowplayer_field_caption]").each( function() { jQuery(this).val( '' ) } );
  jQuery("[name=fv_wp_flowplayer_field_splash_text]").each( function() { jQuery(this).val( '' ) } );
  jQuery(".fv_player_field_insert-button").attr( 'value', 'Insert' );
  
  if(jQuery('#widget-widget_fvplayer-'+FVFP_sWidgetId+'-text').length){
    if(fv_wp_flowplayer_content.match(/\[/) ) {
      fv_wp_flowplayer_content = '[<'+fvwpflowplayer_helper_tag+' rel="FCKFVWPFlowplayerPlaceholder">&shy;</'+fvwpflowplayer_helper_tag+'>'+fv_wp_flowplayer_content.replace('[','')+'';
    } else {
      fv_wp_flowplayer_content =   '<'+fvwpflowplayer_helper_tag+' rel="FCKFVWPFlowplayerPlaceholder">&shy;</'+fvwpflowplayer_helper_tag+'>'+fv_wp_flowplayer_content+'';
    }
    
  }else if( typeof(FCKeditorAPI) == 'undefined' && jQuery('#content:not([aria-hidden=true])').length ){    
    var bFound = false;
    var position = jQuery('#content:not([aria-hidden=true])').prop('selectionStart');
    for(var start = position; start--; start >= 0){
      if( fv_wp_flowplayer_content[start] == '['){
        bFound = true; break;
      }else if(fv_wp_flowplayer_content[start] == ']'){
        break
      }
    }
    var shortcode = [];
   
    if(bFound){    
      var temp = fv_wp_flowplayer_content.slice(start);
      temp = temp.match(/^\[fvplayer[^\[\]]*]?/);
      if(temp){
        shortcode = temp;
        fv_wp_flowplayer_content = fv_wp_flowplayer_content.slice(0, start) + '#fvp_placeholder#' + fv_wp_flowplayer_content.slice(start).replace(/^\[[^\[\]]*]?/, '');
      }else{
        fv_wp_flowplayer_content = fv_wp_flowplayer_content.slice(0, position) + '#fvp_placeholder#' + fv_wp_flowplayer_content.slice(position);
      }
    }else{
      fv_wp_flowplayer_content = fv_wp_flowplayer_content.slice(0, position) + '#fvp_placeholder#' + fv_wp_flowplayer_content.slice(position);
    }   
  }else	if( fv_wp_flowplayer_hTinyMCE == undefined || tinyMCE.activeEditor.isHidden() ) {  
    fv_wp_flowplayer_content = fv_wp_flowplayer_oEditor.GetHTML();    
    if (fv_wp_flowplayer_content.match( fv_wp_flowplayer_re_insert ) == null) {
      fv_wp_flowplayer_oEditor.InsertHtml('<'+fvwpflowplayer_helper_tag+' rel="FCKFVWPFlowplayerPlaceholder">&shy;</'+fvwpflowplayer_helper_tag+'>');
      fv_wp_flowplayer_content = fv_wp_flowplayer_oEditor.GetHTML();    
    }           
	}
	else {
    fv_wp_flowplayer_content = fv_wp_flowplayer_hTinyMCE.getContent();
    fv_wp_flowplayer_hTinyMCE.settings.validate = false;
    if (fv_wp_flowplayer_content.match( fv_wp_flowplayer_re_insert ) == null) {   
      var tags = ['b','span','div'];
      for( var i in tags ){
        fv_wp_flowplayer_hTinyMCE.execCommand('mceInsertContent', false,'<'+tags[i]+' data-mce-bogus="1" rel="FCKFVWPFlowplayerPlaceholder"></'+tags[i]+'>');
        fv_wp_flowplayer_content = fv_wp_flowplayer_hTinyMCE.getContent();
        
        fv_wp_flowplayer_re_edit = new RegExp( '\\[f[^\\]]*?<'+tags[i]+'[^>]*?rel="FCKFVWPFlowplayerPlaceholder"[^>]*?>.*?</'+tags[i]+'>.*?[^\]\\]', "mi" );
        fv_wp_flowplayer_re_insert = new RegExp( '<'+tags[i]+'[^>]*?rel="FCKFVWPFlowplayerPlaceholder"[^>]*?>.*?</'+tags[i]+'>', "gi" );
        
        if( fv_wp_flowplayer_content.match(fv_wp_flowplayer_re_insert) ){
          break;
        }
        
      }
      
    }
    fv_wp_flowplayer_hTinyMCE.settings.validate = true;		
	}
	
  
  var content = fv_wp_flowplayer_content.replace(/\n/g, '\uffff');          
  if(typeof(shortcode) == 'undefined'){
    var shortcode = content.match( fv_wp_flowplayer_re_edit );  
  }

  if( shortcode != null ) {
    shortcode = shortcode.join('');

    // check for new, DB-based player shortcode
    var result = /\[fvplayer id="(\d+)"\]/g.exec(shortcode);
    if (result !== null) {
      fv_flowplayer_conf.new_shortcode_active = true;
      // DB-based player, create a "wait" overlay
      var overlayDiv = fv_wp_flowplayer_big_loader_show();

      // remove everything with index 0 and the initial video placeholder,
      // otherwise our indexing & previews wouldn't work correctly
      jQuery('[data-index="0"]').remove();
      jQuery('.fv-player-tab-playlist table tbody tr').remove();
      jQuery('.fv-player-tab-video-files table').remove();

      // now load playlist data
      // load video data via an AJAX call,
      jQuery.post(ajaxurl, { 'action' : 'return_shortcode_db_data', 'playerID' :  result[1] }, function(response) {
        var vids = response['videos'];

        if (response) {
          var
            $id_player_element = jQuery('#id_player'),
            $deleted_videos_element = jQuery('#deleted_videos'),
            $deleted_video_meta_element = jQuery('#deleted_video_meta'),
            $deleted_player_meta_element = jQuery('#deleted_player_meta');

          if (!$id_player_element.length) {
            // add player ID as a hidden field
            jQuery('#fv-player-shortcode-editor').append('<input type="hidden" name="id_player" id="id_player" value="' + result[1] + '" />');

            // add removed video IDs as a hidden field
            jQuery('#fv-player-shortcode-editor').append('<input type="hidden" name="deleted_videos" id="deleted_videos" />');

            // add removed video meta IDs as a hidden field
            jQuery('#fv-player-shortcode-editor').append('<input type="hidden" name="deleted_video_meta" id="deleted_video_meta" />');

            // add removed player meta IDs as a hidden field
            jQuery('#fv-player-shortcode-editor').append('<input type="hidden" name="deleted_player_meta" id="deleted_player_meta" />');
          } else {
            $id_player_element.val(result[1]);
            $deleted_videos_element.val('');
            $deleted_video_meta_element.val('');
            $deleted_player_meta_element.val('');
          }

          // fire the player load event to cater for any plugins listening
          var $doc = jQuery(document);
          $doc.trigger('fv_flowplayer_player_meta_load', [response]);

          for (var key in response) {
            // put the field value where it belongs
            if (key !== 'videos') {
              var
                real_key = fv_wp_flowplayer_map_names_to_editor_fields(key),
                real_val = fv_wp_flowplayer_map_db_values_to_field_values(key, response[key]),
                // try ID first
                $element = jQuery('#' + real_key);

              if (!$element.length) {
                // no element with this ID found, we need to go for a name
                $element = jQuery('[name="' + real_key + '"]');
              }

              // player and video IDs wouldn't have corresponding fields
              if ($element.length) {
                // dropdowns could have capitalized values
                if ($element.get(0).nodeName == 'SELECT') {
                  if ($element.find('option[value="' + real_val + '"]').length) {
                    $element.val(real_val);
                  } else {
                    // try capitalized
                    var caps = real_val.charAt(0).toUpperCase() + real_val.slice(1);
                    $element.find('option').each(function() {
                      if (this.text == caps) {
                        $(this).attr('selected', 'selected');
                      }
                    });
                  }
                } else if ($element.get(0).nodeName == 'INPUT' && $element.get(0).type.toLowerCase() == 'checkbox') {
                  if (real_val === '1' || real_val === 'on' || real_val === 'true') {
                    $element.attr('checked', 'checked');
                  } else {
                    $element.removeAttr('checked');
                  }
                } else {
                  $element.val(real_val);
                }
              }
            }
          }

          // add videos from the DB
          for (var x in vids) {
            var
              subs = [],
              transcript = null,
              chapters = null;

            // add all subtitles, chapters and transcripts
            if (vids[x].meta && vids[x].meta.length) {
              for (var m in vids[x].meta) {
                // subtitles
                if (vids[x].meta[m].meta_key.indexOf('subtitles') > -1) {
                  subs.push({
                    lang: vids[x].meta[m].meta_key.replace('subtitles_', ''),
                    file: vids[x].meta[m].meta_value,
                    id: vids[x].meta[m].id
                  });
                }

                // chapters
                if (vids[x].meta[m].meta_key.indexOf('chapters') > -1) {
                  chapters = {
                    id: vids[x].meta[m].id,
                    value: vids[x].meta[m].meta_value
                  };
                }

                // transcript
                if (vids[x].meta[m].meta_key.indexOf('transcript') > -1) {
                  transcript = {
                    id: vids[x].meta[m].id,
                    value: vids[x].meta[m].meta_value
                  };
                }
              }
            }

            $video_data_tab = fv_flowplayer_playlist_add(vids[x].src + ',' + vids[x].src_1 + ',' + vids[x].src_2, vids[x].caption, (subs.length ? subs : ''), (vids[x].splash ? {'splash' : vids[x].splash, 'splash_text' : vids[x].splash_text} : vids[x].splash_text), vids[x].id);
            $subtitles_tab = $video_data_tab.parents('.fv-player-tabs:first').find('.fv-player-tab-subtitles table:eq(' + $video_data_tab.data('index') + ')');

            // add chapters and transcript
            if (chapters){
              $subtitles_tab.find('#fv_wp_flowplayer_field_chapters').val(chapters.value).attr('data-id', chapters.id);
            }

            if (transcript) {
              $subtitles_tab.find('.fv_wp_flowplayer_field_transcript').val(transcript.value).attr('data-id', transcript.id);
            }

            // fire up meta load event for this video, so plugins can process it and react
            $doc.trigger('fv_flowplayer_video_meta_load', [x, vids[x].meta, $video_data_tab]);
          }

          // show playlist instead of the "add new video" form
          fv_flowplayer_playlist_show(true);

          // copy the Insert button, place it after the first original one
          // and rename it to Insert as New
          var
            $insert_button = jQuery('.fv_player_field_insert-button:not(.insert_as_new)'),
            $insert_as_new_button = jQuery('.insert_as_new');

          if (!$insert_as_new_button.length) {
            jQuery($insert_button[0].outerHTML)
              .addClass('insert_as_new')
              .val('Insert as New')
              .on('click', function () {
                // remove update and deleted hidden fields, so we insert a new record
                // with our data instead of updating them
                jQuery('#id_player, #deleted_videos, #deleted_video_meta, #deleted_player_meta').remove();
                fv_wp_flowplayer_submit();
                return true;
              })
              .css('margin-left', '5px')
              .insertAfter($insert_button);
          } else {
            $insert_as_new_button.val('Insert as New');
          }

          // update the Insert button to say Update
          $insert_button
            .removeClass('fv_player_field_insert-button')
            .addClass('fv_player_field_update-button')
            .attr('name', 'update')
            .val('Update');
        }

        overlayDiv.remove();
      });
    } else {
      // remove Insert as New, or they'll all get renamed to Update
      // when working with original shortcode
      jQuery('.insert_as_new').remove();
      fv_flowplayer_conf.new_shortcode_active = false;

      // ordinary text shortcode in the editor
      do_shortcode_magic(shortcode);
    }
	} else {
    jQuery(document).trigger('fv_flowplayer_shortcode_new');
    fv_wp_fp_shortcode_remains = '';
  }
}



function fv_wp_delete_player_meta_record(id) {
  var $element = jQuery('#deleted_player_meta');

  if ($element.val()) {
    $element.val($element.val() + ',' + id);
  } else  {
    $element.val(id);
  }
}



function fv_wp_delete_video_meta_record(id) {
  var $element = jQuery('#deleted_video_meta');

  if ($element.val()) {
    $element.val($element.val() + ',' + id);
  } else  {
    $element.val(id);
  }
}



function fv_wp_flowplayer_dialog_resize() {
  var iContentHeight = jQuery('#fv-player-shortcode-editor').height();
  if( iContentHeight < 50 ) iContentHeight = 50;
  if( iContentHeight > jQuery(window).height() - 160 ) iContentHeight = jQuery(window).height() - 160;
  
  iContentHeight = iContentHeight + 50; 
  
  if( fv_wp_flowplayer_dialog_resize_height_record <= iContentHeight ) {
    fv_wp_flowplayer_dialog_resize_height_record = iContentHeight;
    jQuery('#fv-player-shortcode-editor').fv_player_box.resize({width:1100, height:iContentHeight})
  }
}


function fv_wp_flowplayer_on_close() {
  fv_wp_flowplayer_init();
  fv_wp_flowplayer_set_html( fv_wp_flowplayer_content.replace( fv_wp_flowplayer_re_insert, '' ) );
  jQuery('#fv-player-shortcode-editor-preview-target').html('');
}   


function fv_wp_flowplayer_set_html( html ) {
  if( jQuery('#widget-widget_fvplayer-'+FVFP_sWidgetId+'-text').length ){
    jQuery('#widget-widget_fvplayer-'+FVFP_sWidgetId+'-text').val(html);      
    jQuery('#widget-widget_fvplayer-'+FVFP_sWidgetId+'-text').trigger('fv_flowplayer_shortcode_insert', [ html ] );
  }else if( typeof(FCKeditorAPI) == 'undefined' && jQuery('#content:not([aria-hidden=true])').length ){
    jQuery('#content:not([aria-hidden=true])').val(html); 
  }else if( fv_wp_flowplayer_hTinyMCE == undefined || tinyMCE.activeEditor.isHidden() ) {
    fv_wp_flowplayer_oEditor.SetHTML( html );      
  }
  else {		
    fv_wp_flowplayer_hTinyMCE.setContent( html );
  }
}



function fv_wp_flowplayer_get_correct_dropdown_value(optionsHaveNoValue, $valueLessOptions, dropdown_element) {
  // at least one option is value-less
  if ($valueLessOptions.length) {
    if (optionsHaveNoValue) {
      // all options are value-less - the first one is always default and should be sent as ''
      return (dropdown_element.selectedIndex === 0 ? '' : dropdown_element.value);
    } else {
      // some options are value-less
      if ($valueLessOptions.length > 1) {
        // multiple value-less options, while some other options do have a value - this should never be
        console.log('ERROR - Unhandled exception occurred while trying to get player values: more than 1 value-less options found');
        return false;
      } else {
        // single option is value-less (
        return (dropdown_element.selectedIndex === 0 ? '' : dropdown_element.value);
      }
    }
  } else {
    // normal dropdown - all options have a value, return this.value (option's own value)
    return dropdown_element.value;
  }
}



function fv_wp_flowplayer_build_ajax_data() {
  var
      $editor                = jQuery('#fv-player-shortcode-editor')
      $tabs                  = $editor.find('.fv-player-tab'),
      regex                  = /((fv_wp_flowplayer_field_|fv_wp_flowplayer_hlskey|fv_player_field_ppv_)[^ ]*)/g,
      data                   = {'video_meta' : {}},
      end_of_playlist_action = jQuery('#fv_wp_flowplayer_field_end_actions').val();

  // special processing for end video actions
  if (end_of_playlist_action && end_of_playlist_action != 'Nothing') {
    switch (end_of_playlist_action) {
      case 'redirect':
        data['fv_wp_flowplayer_field_end_action_value'] = jQuery('#fv_wp_flowplayer_field_redirect').val();
        break;

      case 'popup':
        data['fv_wp_flowplayer_field_end_action_value'] = jQuery('#fv_wp_flowplayer_field_popup_id').val();
        break;

      case 'email_list':
        data['fv_wp_flowplayer_field_end_action_value'] = jQuery('#fv_wp_flowplayer_field_email_list').val();
        break;
    }
  }

  // trigger meta data save events, so we get meta data from different
  // plugins included as we post
  jQuery(document).trigger('fv_flowplayer_player_meta_save', [data]);

  $tabs.each(function() {
    var
      $tab = jQuery(this),
      is_videos_tab = $tab.hasClass('fv-player-tab-video-files'),
      is_subtitles_tab = $tab.hasClass('fv-player-tab-subtitles'),
      $tables = ((is_videos_tab || is_subtitles_tab) ? $tab.find('table') : $tab.find('input, select, textarea'));

    // prepare video and subtitles data, which are duplicated through their input names
    if (is_videos_tab) {
      data['videos'] = {};
    } else if (is_subtitles_tab) {
      data['video_meta']['subtitles'] = {};
      data['video_meta']['transcript'] = {};
      data['video_meta']['chapters'] = {};
    }

    // iterate over all tables in tabs
    $tables.each(function(table_index) {
      // only videos and subtitles tabs have tables, so we only need to search for their inputs when working with those
      var $inputs = ((is_videos_tab || is_subtitles_tab) ? jQuery(this).find('input, select, textarea') : jQuery(this));

      $inputs.each(function() {
        var
          $this               = jQuery(this),
          $parent_tr          = $this.closest('tr'),
          optionsHaveNoValue = false, // will become true for dropdown options without values
          $valueLessOptions   = null,
          isDropdown          = this.nodeName == 'SELECT';

        // exceptions for selectively hidden fields
        if ($parent_tr.hasClass('fv_player_interface_hide') && $parent_tr.css('display') == 'none') {
          return;
        }

        // check for a select without any option values, in which case we'll use their text
        if (isDropdown) {
          $valueLessOptions = $this.find('option:not([value])');
          if ($valueLessOptions.length == this.length) {
            optionsHaveNoValue = true;
          }
        }

        while ((m = regex.exec(this.name)) !== null) {
          // This is necessary to avoid infinite loops with zero-width matches
          if (m.index === regex.lastIndex) {
            regex.lastIndex++;
          }

          // videos tab
          if (is_videos_tab) {
            if (!data['videos'][table_index]) {
              data['videos'][table_index] = {
                id: jQuery('.fv-player-playlist-item[data-index=' + table_index + ']').data('id_video')
              };
            }

            // let plugins update video meta, if applicable
            jQuery(document).trigger('fv_flowplayer_video_meta_save', [data, table_index, this]);

            // check dropdown for its value based on values in it
            if (isDropdown) {
              var opt_value = fv_wp_flowplayer_get_correct_dropdown_value(optionsHaveNoValue, $valueLessOptions, this);
              // if there were any problems, just return an empty object
              if (opt_value === false) {
                return {};
              } else {
                data['videos'][table_index][m[1]] = opt_value;
              }
            } else {
              data['videos'][table_index][m[1]] = this.value;
            }
          }

          // subtitles tab, subtitles inputs
          else if (is_subtitles_tab && $this.hasClass('fv_wp_flowplayer_field_subtitles')) {
            if (!data['video_meta']['subtitles'][table_index]) {
              data['video_meta']['subtitles'][table_index] = [];
            }

            // jQuery-select the SELECT element when we get an INPUT, since we need to pair them
            if (this.nodeName == 'INPUT') {
              data['video_meta']['subtitles'][table_index].push({
                code : $this.siblings('select:first').val(),
                file : this.value,
                id: $this.parent().data('id_subtitles')
              });
            }
          }

          // subtitles tab, chapters input
          else if (is_subtitles_tab && $this.attr('id') == 'fv_wp_flowplayer_field_chapters') {
            if (!data['video_meta']['chapters'][table_index]) {
              data['video_meta']['chapters'][table_index] = {};
            }

            fv_flowplayer_insertUpdateOrDeleteVideoMeta({
              data: data,
              meta_section: 'chapters',
              meta_key: 'file',
              meta_index: table_index,
              element: $this
            });
          }

          // subtitles tab, transcript input
          else if (is_subtitles_tab && $this.hasClass('fv_wp_flowplayer_field_transcript')) {
            if (!data['video_meta']['transcript'][table_index]) {
              data['video_meta']['transcript'][table_index] = {};
            }

            fv_flowplayer_insertUpdateOrDeleteVideoMeta({
              data: data,
              meta_section: 'transcript',
              meta_key: 'file',
              meta_index: table_index,
              element: $this
            });
          }

          // all other tabs
          else {
            if (this.nodeName == 'INPUT' && this.type.toLowerCase() == 'checkbox') {
              data[m[1]] = this.checked ? 'true' : '';
            } else {
              // check dropdown for its value based on values in it
              if (isDropdown) {
                var opt_value = fv_wp_flowplayer_get_correct_dropdown_value(optionsHaveNoValue, $valueLessOptions, this);
                // if there were any problems, just return an empty object
                if (opt_value === false) {
                  return {};
                } else {
                  data[m[1]] = opt_value.toLowerCase();
                }
              } else {
                data[m[1]] = this.value;
              }
            }
          }
        }
      });
    });
  });

  // remove any empty videos, i.e. without a source
  // this is used when loading data from DB to avoid previewing an empty video that's in editor by default
  if (data['videos']) {
    var
      data_videos_new = {},
      x = 0;

    for (var i in data['videos']) {
      if (data['videos'][i]['src'] || data['videos'][i]['src_1'] || !data['videos'][i]['src_2']) {
        data_videos_new[x++] =  data['videos'][i];
      }
    }

    data['videos'] = data_videos_new;
  }

  // add player ID and deleted elements for a DB update
  var $updateElement = jQuery('#id_player');
  if ($updateElement.length) {
    data['update'] = $updateElement.val();
    data['deleted_videos'] = jQuery('#deleted_videos').val();
    data['deleted_video_meta'] = jQuery('#deleted_video_meta').val();
    data['deleted_player_meta'] = jQuery('#deleted_player_meta').val();
  }

  return data;
}



function fv_wp_flowplayer_calculatePreviewDimensions(divPreview) {
  var width = parseInt(jQuery('#fv_wp_flowplayer_field_width').val()) || 460;
  var height = parseInt(jQuery('#fv_wp_flowplayer_field_height').val()) || 300;
  if (divPreview.length && divPreview.width() < width) {
    height = Math.round(height * (divPreview.width() / width));
    width = divPreview.width();
  }

  return {
    width: width,
    height: height
  };
}



function fv_wp_flowplayer_show_preview(has_src, data, is_post) {
  var $previewDiv = jQuery('#fv-player-shortcode-editor-preview');

  jQuery('#fv-player-shortcode-editor-preview-iframe-refresh').hide();
  //jQuery('#fv-player-tabs-debug').html(fv_wp_fp_shortcode);
  if (!has_src) {
    $previewDiv.attr('class', 'preview-no');
    fv_player_shortcode_preview = false;
    //console.log('fv_player_shortcode_preview = false');
    fv_wp_flowplayer_dialog_resize();
    return;
  }

  $previewDiv.attr('class','preview-loading');
  var url = fv_Player_site_base + '?fv_player_embed=1&fv_player_preview=';

  if (typeof(is_post) !== 'undefined') {
    url += 'POST';
  } else {
    url += encodeURIComponent(b64EncodeUnicode(data));
  }

  if(fv_player_shortcode_preview_unsupported){
    jQuery('#fv-player-shortcode-editor-preview-new-tab > a').html('Open preview in a new window');
    if( jQuery('#fv-player-shortcode-editor-preview div.incompatibility').length == 0 ) jQuery('#fv-player-shortcode-editor-preview-new-tab').after('<div class="notice notice-warning incompatibility"><p>For live preview of the video player please use the latest Firefox, Chromium or Opera.</p></div>');
  }

  // TODO: this opens preview in a new window for a nicer preview but won't work with new DB-based shortcode generation,
  //       as we're sending all the inputs as data and that would be too big for a GET request
  //       ... find a way to circumvent this
  /*if(fv_player_preview_single === -1 && jQuery('.fv-player-tab-video-files table').length > 9 || fv_player_shortcode_preview_unsupported){
    $previewDiv.attr('class','preview-new-tab');
    fv_player_shortcode_preview = false;
    //console.log('fv_player_shortcode_preview = false');
    jQuery('#fv-player-shortcode-editor-preview-new-tab > a').unbind('click').on('click',function(e){
      fv_wp_flowplayer_submit(true);
      url = fv_Player_site_base + '?fv_player_embed=1&fv_player_preview=' + encodeURIComponent(b64EncodeUnicode(data))
      fv_player_open_preview_window( url, width, height + Math.ceil( (jQuery('.fv-player-tab-video-files table').length / 3)) * 155 );
      return false;
    });

    return;
  }*/

  //console.log('Iframe refresh with '+fv_wp_fp_shortcode);
  if( typeof(fv_player_shortcode_editor_last_url) == 'undefined' || url !== fv_player_shortcode_editor_last_url ){
    fv_player_shortcode_editor_last_url = url;
    var $previewTarget = jQuery('#fv-player-shortcode-editor-preview-target');
    $previewTarget.html('');

    if (typeof(is_post) != 'undefined') {
      jQuery.post(url, data, function (response) {
        $previewTarget.html(jQuery('#wrapper', response));
        jQuery(document).trigger('fvp-preview-complete');
      });
    } else {
      jQuery.get(url, function (response) {
        $previewTarget.html(jQuery('#wrapper', response));
        jQuery(document).trigger('fvp-preview-complete');
      });
    }
  }else{
    jQuery(document).trigger('fvp-preview-complete');
  }
}



function fv_wp_flowplayer_big_loader_show() {
  // DB-based player, create a "wait" overlay
  var overlayDiv = jQuery('#fv-player-shortcode-editor-preview-spinner').clone().css({
    'height' : '100%'
  });

  jQuery('#fv-player-shortcode-editor').before(overlayDiv);

  return overlayDiv;
}



function fv_wp_flowplayer_submit( preview ) {
  if( preview && typeof(fv_player_shortcode_preview) != "undefined" && fv_player_shortcode_preview ){
    //console.log('fv_wp_flowplayer_submit skip...',fv_player_shortcode_preview);
    return;
  }
  
  if( preview == 'refresh-button' ) {
    jQuery('#fv-player-shortcode-editor-preview-iframe-refresh').show();
    return;
  }  
  
  fv_player_shortcode_preview = true;
  //console.log('fv_player_shortcode_preview = true');
  
  fv_wp_fp_shortcode = '';
  var shorttag = 'fvplayer';
  var divPreview = jQuery('#fv-player-shortcode-editor-preview');
	
	if(
    !preview &&
    jQuery(".fv_wp_flowplayer_field_rtmp").attr('placeholder') == '' &&
		jQuery(".fv_wp_flowplayer_field_rtmp_wrapper").is(":visible") &&
		(
			( jQuery(".fv_wp_flowplayer_field_rtmp").val() != '' && jQuery(".fv_wp_flowplayer_field_rtmp_path").val() == '' ) ||
			( jQuery(".fv_wp_flowplayer_field_rtmp").val() == '' && jQuery(".fv_wp_flowplayer_field_rtmp_path").val() != '' )
		)
	) {
		alert('Please enter both server and path for your RTMP video.');
		return false;
	} else if( 
          !preview &&
          document.getElementById("fv_wp_flowplayer_field_src").value == '' 
          && jQuery(".fv_wp_flowplayer_field_rtmp").val() == '' 
          && jQuery(".fv_wp_flowplayer_field_rtmp_path").val() == '') {
		alert('Please enter the file name of your video file.');
		return false;
	} else {
    fv_wp_fp_shortcode = '[' + shorttag;
  }

  var
    previewWidth = null,
    previewHeight = null;

  // if we're using the new DB-related shortcode, let's handle it here
  if (fv_flowplayer_conf.new_shortcode) {
	  var ajax_data = fv_wp_flowplayer_build_ajax_data();

	  if (preview) {
	    // don't use DB preview if we're working with a standard shortcode
	    if (fv_flowplayer_conf.new_shortcode_active) {
        var previewDimensions = fv_wp_flowplayer_calculatePreviewDimensions(divPreview);
        previewWidth = previewDimensions.width;
        previewHeight = previewDimensions.height;
        ajax_data['fv_wp_flowplayer_field_width'] = previewWidth;
        ajax_data['fv_wp_flowplayer_field_height'] = previewHeight;
        fv_wp_flowplayer_show_preview(true, ajax_data, true);
        return;
      }
    } else {
	    // show saving loader
      fv_wp_flowplayer_big_loader_show();

      // save data
      jQuery.post(ajaxurl, {
        action: 'fv_wp_flowplayer_db_store_player_data',
        data: ajax_data,
        cookie: encodeURIComponent(document.cookie),
      }, function(playerID) {
        fv_wp_flowplayer_insert('[fvplayer id="' + playerID + '"]');
        jQuery(".fv-wordpress-flowplayer-button").fv_player_box.close();
      });

      return;
    }
  }

  if( fv_player_preview_single == -1 ) {
    fv_wp_flowplayer_shortcode_write_arg('fv_wp_flowplayer_field_src','src');
    fv_wp_flowplayer_shortcode_write_arg('fv_wp_flowplayer_field_src_1','src1');
    fv_wp_flowplayer_shortcode_write_arg('fv_wp_flowplayer_field_src_2','src2');
    fv_wp_flowplayer_shortcode_write_arg('fv_wp_flowplayer_field_rtmp','rtmp');
    fv_wp_flowplayer_shortcode_write_arg('fv_wp_flowplayer_field_rtmp_path','rtmp_path');
    fv_wp_flowplayer_shortcode_write_arg('fv_wp_flowplayer_field_live', 'live', false, true );	        
    fv_wp_flowplayer_shortcode_write_arg('fv_wp_flowplayer_field_mobile','mobile');  
    fv_wp_flowplayer_shortcode_write_arg('fv_wp_flowplayer_field_splash','splash');
  } else {
    var item = jQuery('.fv-player-tab-video-files table').eq(fv_player_preview_single);    
    fv_wp_flowplayer_shortcode_write_arg(item.find('#fv_wp_flowplayer_field_src')[0],'src');
    fv_wp_flowplayer_shortcode_write_arg(item.find('#fv_wp_flowplayer_field_src_1')[0],'src1');
    fv_wp_flowplayer_shortcode_write_arg(item.find('#fv_wp_flowplayer_field_src_2')[0],'src2');
    fv_wp_flowplayer_shortcode_write_arg(item.find('#fv_wp_flowplayer_field_rtmp')[0],'rtmp');
    fv_wp_flowplayer_shortcode_write_arg(item.find('#fv_wp_flowplayer_field_rtmp_path')[0],'rtmp_path');
    fv_wp_flowplayer_shortcode_write_arg(item.find('#fv_wp_flowplayer_field_live')[0], 'live', false, true );	        
    fv_wp_flowplayer_shortcode_write_arg(item.find('#fv_wp_flowplayer_field_mobile')[0],'mobile');  
    fv_wp_flowplayer_shortcode_write_arg(item.find('#fv_wp_flowplayer_field_splash')[0],'splash');
    
    //  todo: how to handle RTMP server here?
  }
  
  var width , height;
  if(!preview){
    fv_wp_flowplayer_shortcode_write_arg('fv_wp_flowplayer_field_width','width','int');
    fv_wp_flowplayer_shortcode_write_arg('fv_wp_flowplayer_field_height','height','int');
  }else{
    if (previewWidth === null) {
      var previewDimensions = fv_wp_flowplayer_calculatePreviewDimensions(divPreview);
      width = previewDimensions.width;
      height = previewDimensions.height;
    }
    fv_wp_fp_shortcode += ' width="' + width + '" '    
    fv_wp_fp_shortcode += ' height="' + height + '" '
  }
  
  fv_wp_flowplayer_shortcode_write_arg( 'fv_wp_flowplayer_field_align', 'align', false, false, ['left', 'right'] );
  fv_wp_flowplayer_shortcode_write_arg( 'fv_wp_flowplayer_field_autoplay', 'autoplay', false, false, ['true', 'false'] );
  fv_wp_flowplayer_shortcode_write_arg( 'fv_wp_flowplayer_field_playlist', 'liststyle', false, false, ['tabs', 'prevnext', 'vertical','horizontal','text','slider'] );
  fv_wp_flowplayer_shortcode_write_arg( 'fv_wp_flowplayer_field_controlbar', 'controlbar', false, false, ['yes', 'no'] );
  fv_wp_flowplayer_shortcode_write_arg( 'fv_wp_flowplayer_field_embed', 'embed', false, false, ['true', 'false'] );
  fv_wp_flowplayer_shortcode_write_arg( 'fv_wp_flowplayer_field_speed', 'speed', false, false, ['buttons', 'no'] );
  fv_wp_flowplayer_shortcode_write_arg( 'fv_wp_flowplayer_field_playlist_advance', 'playlist_advance', false, false, ['true', 'false'] );
  fv_wp_flowplayer_shortcode_write_arg( 'fv_wp_flowplayer_field_sticky', 'sticky', false, false, ['true', 'false'] );
  fv_wp_flowplayer_shortcode_write_arg( 'fv_wp_flowplayer_field_share', 'share', false, false, ['yes', 'no', jQuery('#fv_wp_flowplayer_field_share_title').val().replace(/;/,'').replace(/(\S)$/,'$1;')+jQuery('#fv_wp_flowplayer_field_share_url').val().replace(/;/,'')] );

  
  /*
   * End of playlist dropdown
   * legacy:
   * fv_wp_flowplayer_shortcode_write_arg( 'fv_wp_flowplayer_field_loop', 'loop', false, true );
   * fv_wp_flowplayer_shortcode_write_arg('fv_wp_flowplayer_field_redirect','redirect');
   * fv_wp_flowplayer_shortcode_write_arg( 'fv_wp_flowplayer_field_splashend', 'splashend', false, true, ['show'] );
   */
  switch(jQuery('#fv_wp_flowplayer_field_end_actions').val()){
    case 'loop': fv_wp_fp_shortcode += ' loop="true"'; break;
    case 'splashend': fv_wp_fp_shortcode += ' splashend="show"'; break;
    case 'redirect': fv_wp_flowplayer_shortcode_write_arg('fv_wp_flowplayer_field_redirect','redirect'); break;
    case 'popup': 
      if( jQuery('[name=fv_wp_flowplayer_field_popup]').val() !== ''){
        fv_wp_flowplayer_shortcode_write_arg('fv_wp_flowplayer_field_popup','popup','html');
      }else{
        fv_wp_flowplayer_shortcode_write_arg('fv_wp_flowplayer_field_popup_id', 'popup', false, false, ['no','random','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16'] );
      }
    break;
    case 'email_list':
      var value = jQuery('#fv_wp_flowplayer_field_email_list').val();
      if(value)
        fv_wp_fp_shortcode += ' popup="email-' + value + '"';
    break;

  }
  
  
  jQuery('.fv_wp_flowplayer_field_subtitles').each( function() {
    var lang = jQuery(this).siblings('.fv_wp_flowplayer_field_subtitles_lang').val();
    if( lang ) fv_wp_flowplayer_shortcode_write_arg( jQuery(this)[0], 'subtitles_' + lang );  //  non language specific subtitles are handled on playlist level. what?
  });   
  
  fv_wp_flowplayer_shortcode_write_arg('fv_wp_flowplayer_field_ad','ad','html');
  //  
  
  fv_wp_flowplayer_shortcode_write_arg('fv_wp_flowplayer_field_ad_height','ad_height','int');
  fv_wp_flowplayer_shortcode_write_arg('fv_wp_flowplayer_field_ad_skip','ad_skip', false, true, ['yes']);
	fv_wp_flowplayer_shortcode_write_arg('fv_wp_flowplayer_field_ad_width','ad_width','int');

	if( fv_player_preview_single == -1 && jQuery('.fv-player-tab-video-files table').length > 0 ) {
		var aPlaylistItems = new Array();
    var aPlaylistCaptions = new Array();
    var aSplashText = new Array();
    
    var aPlaylistSubtitles = new Array();
		jQuery('.fv-player-tab-video-files table').each(function(i,e) {
      aPlaylistCaptions.push(jQuery('[name=fv_wp_flowplayer_field_caption]',this).attr('value').trim().replace(/\;/gi,'\\;').replace(/"/gi,'&amp;quot;') );
      
      aSplashText.push(jQuery('[name=fv_wp_flowplayer_field_splash_text]', this).attr('value').trim().replace(/\;/gi,'\\;').replace(/"/gi,'&amp;quot;') );
      
      var video_subtitles = jQuery('.fv-player-tab-subtitles table').eq(i);
      video_subtitles.find('[name=fv_wp_flowplayer_field_subtitles]').each( function() {
        if( jQuery(this).prev('.fv_wp_flowplayer_field_subtitles_lang').val() ) {
          aPlaylistSubtitles.push('');
          return;
        }
        aPlaylistSubtitles.push( jQuery(this).attr('value').trim().replace(/\;/gi,'\\;').replace(/"/gi,'&amp;quot;') );
      });
      
		  if( i == 0 ) return;  
      var aPlaylistItem = new Array();      

      jQuery(this).find('input').each( function() {
        if( jQuery(this).attr('name').match(/fv_wp_flowplayer_field_caption/) ) return;
        if( jQuery(this).attr('name').match(/fv_wp_flowplayer_field_splash_text/) ) return;
        if( jQuery(this).hasClass('fv_wp_flowplayer_field_rtmp') || jQuery(this).hasClass('fv_wp_flowplayer_field_width') || jQuery(this).hasClass('fv_wp_flowplayer_field_height') ) return;
        if( jQuery(this).hasClass('extra-field') ) return;
        if( jQuery(this).attr('value').trim().length > 0 ) { 
          var value = jQuery(this).attr('value').trim()
          if( jQuery(this).hasClass('fv_wp_flowplayer_field_rtmp_path') ) value = "rtmp:"+value;
          aPlaylistItem.push(value);
        }
      } );			
      if( aPlaylistItem.length > 0 ) {
        aPlaylistItems.push(aPlaylistItem.join(','));
      }
    }
		);
		var sPlaylistItems = aPlaylistItems.join(';');
    var sPlaylistCaptions = aPlaylistCaptions.join(';');
    var sPlaylistSubtitles = aPlaylistSubtitles.join(';');
    var sSplashText = aSplashText.join(';');
		if( sPlaylistItems.length > 0 ) {
			fv_wp_fp_shortcode += ' playlist="'+sPlaylistItems+'"';
		}

    var bPlaylistCaptionExists = false;
    for( var i in aPlaylistCaptions ){
      if( typeof(aPlaylistCaptions[i]) == "string" && aPlaylistCaptions[i].trim().length > 0 ) {
        bPlaylistCaptionExists = true;
      }
    }
		if( bPlaylistCaptionExists && sPlaylistCaptions.length > 0 ) {
			fv_wp_fp_shortcode += ' caption="'+sPlaylistCaptions+'"';
		}
    
    if( sPlaylistSubtitles.replace(/[; ]/g,'').length > 0 && sPlaylistSubtitles.length > 0 ) {
			fv_wp_fp_shortcode += ' subtitles="'+sPlaylistSubtitles+'"';
		}
    
    var bPlaylistSplashTextExists = false;
    for( var i in aSplashText ){
      if( typeof(aSplashText[i]) == "string" && aSplashText[i].trim().length > 0 ) {
        bPlaylistSplashTextExists = true;
      }
    }
		if( bPlaylistSplashTextExists && aSplashText.length > 0 ) {
			fv_wp_fp_shortcode += ' splash_text="'+sSplashText+'"';
		}    
	}

  jQuery(document).trigger('fv_flowplayer_shortcode_create');
	
	if( fv_wp_fp_shortcode_remains && fv_wp_fp_shortcode_remains.trim().length > 0 ) {
  	fv_wp_fp_shortcode += ' ' + fv_wp_fp_shortcode_remains.trim();
  }
  
	fv_wp_fp_shortcode += ']';
	
  //Preview
  if(preview){
    fv_wp_flowplayer_show_preview(fv_wp_fp_shortcode.match(/src=/), fv_wp_fp_shortcode);
    return;
  }

  jQuery(".fv-wordpress-flowplayer-button").fv_player_box.close();

  fv_wp_flowplayer_insert(fv_wp_fp_shortcode);
}

function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
}


function fv_player_open_preview_window(url, width, height){
  height = Math.min(window.screen.availHeight * 0.80, height + 25);
  width = Math.min(window.screen.availWidth * 0.66, width + 100);
  
  if(fv_player_preview_window == null || fv_player_preview_window.self == null || fv_player_preview_window.closed ){
    fv_player_preview_window = window.open(url,'window','toolbar=no, menubar=no, resizable=yes width=' + width + ' height=' + height);
  }else{
    fv_player_preview_window.location.assign(url);
    fv_player_preview_window.focus();
  }
  
}


function fv_player_refresh_tabs(){
  var visibleTabs = 0;
  jQuery('#fv-player-shortcode-editor-editor a[data-tab]').removeClass('fv_player_interface_hide');
  jQuery('#fv-player-shortcode-editor-editor .fv-player-tabs > .fv-player-tab').each(function(){   
    var bHideTab = true
    jQuery(this).find('tr:not(.fv_player_actions_end-toggle):not(.submit-button-wrapper)').each(function(){
      if(jQuery(this).css('display') === 'table-row'){
        bHideTab = false;
        return false;
      }
    });
    var tab;
    var data = jQuery(this).attr('class').match(/fv-player-tab-[^ ]*/);
      if(data[0]){
      tab =  jQuery('#fv-player-shortcode-editor-editor a[data-tab=' + data[0] + ']');
      }
    if(bHideTab){
      tab.addClass('fv_player_interface_hide')
    }else{
      tab.removeClass('fv_player_interface_hide');
      if(tab.css('display')!=='none')
        visibleTabs++
      
    }
  });
  
  if(visibleTabs<=1){
    jQuery('#fv-player-shortcode-editor-editor .nav-tab').addClass('fv_player_interface_hide');
  }
  
  if(jQuery('#fv-player-shortcode-editor-editor').hasClass('is-playlist-active')){		
    jQuery('label[for=fv_wp_flowplayer_field_end_actions]').html(jQuery('label[for=fv_wp_flowplayer_field_end_actions]').data('playlist-label'))		
  }else{		
    jQuery('label[for=fv_wp_flowplayer_field_end_actions]').html(jQuery('label[for=fv_wp_flowplayer_field_end_actions]').data('single-label'))		
  }		
   
  
}

function fv_wp_flowplayer_add_format() {
  if ( jQuery("#fv_wp_flowplayer_field_src").val() != '' ) {
    if ( jQuery(".fv_wp_flowplayer_field_src_1_wrapper").is(":visible") ) {      
      if ( jQuery("#fv_wp_flowplayer_field_src_1").val() != '' ) {
        jQuery(".fv_wp_flowplayer_field_src_2_wrapper").show();
        jQuery("#fv_wp_flowplayer_field_src_2_uploader").show();
        jQuery("#add_format_wrapper").hide();
      }
      else {
        alert('Please enter the file name of your second video file.');
      }
    }
    else {
      jQuery(".fv_wp_flowplayer_field_src_1_wrapper").show();
      jQuery("#fv_wp_flowplayer_field_src_1_uploader").show();
    }
    fv_wp_flowplayer_dialog_resize();
  }
  else {
    alert('Please enter the file name of your video file.');
  }
}

function fv_wp_flowplayer_add_rtmp(el) {
	jQuery(el).parents('.fv-player-playlist-item').find(".fv_wp_flowplayer_field_rtmp_wrapper").show();
  jQuery(el).parents('.fv-player-playlist-item').find(".add_rtmp_wrapper").hide();
	fv_wp_flowplayer_dialog_resize();
}

function fv_wp_flowplayer_shortcode_parse_arg( sShortcode, sArg, bHTML, sCallback ) {

  var rDoubleQ = new RegExp(sArg+"=\"","g");
  var rSingleQ = new RegExp(sArg+"='","g");
  var rNoQ = new RegExp(sArg+"=[^\"']","g");
  
  var rMatch = false;
  if( sShortcode.match(rDoubleQ) ) {
    //rMatch = new RegExp(sArg+'="(.*?[^\\\\/])"',"g");
    rMatch = new RegExp('[ "\']' + sArg + '="(.*?[^\\\\])"', "g");
  } else if (sShortcode.match(rSingleQ)) {
    rMatch = new RegExp('[ "\']' + sArg + "='([^']*?)'", "g");
  } else if (sShortcode.match(rNoQ)) {
    rMatch = new RegExp('[ "\']' + sArg + "=([^\\]\\s,]+)", "g");
  }

  if( !rMatch ){
    return false;
  }
  
  var aOutput = rMatch.exec(sShortcode);
  fv_wp_fp_shortcode_remains = fv_wp_fp_shortcode_remains.replace( rMatch, '' );
 
  if( bHTML ) {
    aOutput[1] = aOutput[1].replace(/\\"/g, '"').replace(/\\(\[|])/g, '$1');
  }
  
  if( aOutput && sCallback ) {
    sCallback(aOutput);
  } else {
   return aOutput;
  }
}


function fv_wp_flowplayer_subtitle_parse_arg( args ) {
  var input = ('fv_wp_flowplayer_subtitle_parse_arg',args);
  var aLang = input[0].match(/subtitles_([a-z][a-z])/);
  fv_flowplayer_language_add( input[1], aLang[1] );
}


function fv_wp_flowplayer_share_parse_arg( args ) {
  if (args[1] == 'yes' ) {
    document.getElementById("fv_wp_flowplayer_field_share").selectedIndex = 1;
  } else if (args[1] == 'no' ) {
    document.getElementById("fv_wp_flowplayer_field_share").selectedIndex = 2;
  } else {
    document.getElementById("fv_wp_flowplayer_field_share").selectedIndex = 3;
    args = args[1].split(';');
    if( typeof(args[0]) == "string" ) jQuery('#fv_wp_flowplayer_field_share_url').val(args[0]);
    if( typeof(args[1]) == "string" ) jQuery('#fv_wp_flowplayer_field_share_title').val(args[1]);
    jQuery("#fv_wp_flowplayer_field_share_custom").show();
  }
}


function fv_wp_flowplayer_shortcode_write_args( sField, sArg, sKind, bCheckbox, aValues ) {
  jQuery('[id='+sField+']').each( function(k,v) {
    k = (k==0) ? '' : k;
    fv_wp_flowplayer_shortcode_write_arg(jQuery(this)[0],sArg+k, sKind, bCheckbox, aValues);
  });
}

function fv_wp_flowplayer_shortcode_write_arg( sField, sArg, sKind, bCheckbox, aValues ) {
  var element;
  if ( typeof(sField) == "string" ) {
    element = document.getElementById(sField);
  } else {
    element = sField;
  }
  if( typeof(element) == "undefined") {
    return false;
  }
  
  var sValue = false;
  if( bCheckbox ) {
    if( element.checked ){
      if( aValues ) {
        sValue = aValues[0];
      } else {
        sValue = 'true';
      }
    }
  } else if( aValues ){
    if( typeof(aValues[element.selectedIndex -1 ]) == "undefined" ) {
      return false;
    }
    sValue = aValues[element.selectedIndex -1 ];
  } else if( element.value != '' ) {
    sValue = element.value.trim();
    var sOutput = false;
    
    if( sKind == "int" ) {
      if( sValue % 1 !=0 ){
        return false;
      }
    } else if( sKind == 'html' ){
      sValue = sValue.replace(/&/g,'&amp;');
      //sValue = sValue.replace(/'/g,'\\\'');
      //sValue = sValue.replace(/"/g,'&quot;');
      sValue = sValue.replace(/</g,'&lt;');
      sValue = sValue.replace(/>/g,'&gt;');
    }
  } else {
    return false;
  }
    
  if( !sValue ){
    return false;
  }

  if( sValue.match(/"/) || sKind == 'html' ){
    sOutput = '"'+sValue.replace(/"/g, '\\"').replace(/(\[|])/g, '\\$1')+'"';
  } else {
    sOutput = '"'+sValue+'"';
  }
  
  if( sOutput ){
    fv_wp_fp_shortcode += ' '+sArg+'='+sOutput; 
  }
  return sValue;
};


function fv_flowplayer_shortcode_editor_cleanup(sInput) {
  sInput[1] = sInput[1].replace(/\\;/gi, '<!--FV Flowplayer Caption Separator-->').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  aInput = sInput[1].split(';');
  for( var i in aInput ){
    aInput[i] = aInput[i].replace(/\\"/gi, '"');
    aInput[i] = aInput[i].replace(/\\<!--FV Flowplayer Caption Separator-->/gi, ';');
    aInput[i] = aInput[i].replace(/<!--FV Flowplayer Caption Separator-->/gi, ';');
  }
  return aInput;
};

jQuery(document).on('fv_flowplayer_shortcode_insert', function(e) {
  jQuery(e.target).siblings('.button.fv-wordpress-flowplayer-button').val('Edit');
});

function fv_flowplayer_insertUpdateOrDeletePlayerMeta(options) {
  var
    $element = jQuery(options.element),
    $deleted_meta_element = jQuery('#deleted_player_meta');

  // don't do anything if we've not found the actual element
  if (!$element.length) {
    return;
  }

  // check whether to update or delete this meta
  if ($element.data('id')) {
    // only delete this meta if delete was not prevented via options
    // and if there was no value specified, otherwise update
    if ((!options.handle_delete || options.handle_delete !== false) && !$element.val()) {
      if ($deleted_meta_element.val()) {
        $deleted_meta_element.val($deleted_meta_element.val() + ',' + $element.data('id'));
      } else {
        $deleted_meta_element.val($element.data('id'));
      }

      $element
        .removeData('id')
        .removeAttr('data-id');

      // execute delete callback, if present
      if (options.delete_callback && typeof(options.delete_callback) == 'function') {
        options.delete_callback();
      }
    } else {
      // update if we have an ID
      options.data['player_meta'][options.meta_section][options.meta_key] = {
        'id': $element.data('id'),
        'value': $element.val()
      }

      // execute update callback, if present
      if (options.edit_callback && typeof(options.edit_callback) == 'function') {
        options.edit_callback();
      }
    }
  } else if ($element.val()) {
    // insert new data if no meta ID
    options.data['player_meta'][options.meta_section][options.meta_key] = {
      'value': $element.val()
    }

    // execute insert callback, if present
    if (options.insert_callback && typeof(options.insert_callback) == 'function') {
      options.insert_callback();
    }
  }
};

function fv_flowplayer_insertUpdateOrDeleteVideoMeta(options) {
  var
    $element = jQuery(options.element),
    $deleted_meta_element = jQuery('#deleted_video_meta');

  // don't do anything if we've not found the actual element
  if (!$element.length) {
    return;
  }

  // check whether to update or delete this meta
  if ($element.data('id')) {
    // only delete this meta if delete was not prevented via options
    // and if there was no value specified, otherwise update
    if ((!options.handle_delete || options.handle_delete !== false) && !$element.val()) {
      if ($deleted_meta_element.val()) {
        $deleted_meta_element.val($deleted_meta_element.val() + ',' + $element.data('id'));
      } else {
        $deleted_meta_element.val($element.data('id'));
      }

      $element
        .removeData('id')
        .removeAttr('data-id');

      // execute delete callback, if present
      if (options.delete_callback && typeof(options.delete_callback) == 'function') {
        options.delete_callback();
      }
    } else {
      // update if we have a value
      options.data['video_meta'][options.meta_section][options.meta_index][options.meta_key] = {
        'id': $element.data('id'),
        'value': $element.val()
      }

      // execute update callback, if present
      if (options.edit_callback && typeof(options.edit_callback) == 'function') {
        options.edit_callback();
      }
    }
  } else if ($element.val()) {
    // insert new data if no meta ID
    options.data['video_meta'][options.meta_section][options.meta_index][options.meta_key] = {
      'value': $element.val()
    }

    // execute insert callback, if present
    if (options.insert_callback && typeof(options.insert_callback) == 'function') {
      options.insert_callback();
    }
  }
};