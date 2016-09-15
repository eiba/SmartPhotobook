var currentImgId = null;
var Open = false;
var AlbumList = [];
var AlbumImageCount = 0;

function setHandlers(image){
    var img = document.getElementById(image.imageId);
    var modalImg = document.getElementById(image.modalImg);
    var modal = document.getElementById(image.modalId);
    var caption = document.getElementById(image.captionId);
    //var description = document.getElementById('description');

    img.onclick = function(){
        modal.style.display = "block";
        modalImg.src = this.src;
        currentImgId = image.imageId;
        Open = true;
        //captionText.innerHTML = this.alt;
    };
    $('#'+image.sliderId).slider({
        formatter: function(value) {
            return value;
        }
    });
    caption.onclick =function(e) {
        e.stopPropagation();
    };
    modalImg.onclick =function(e) {
        e.stopPropagation();
    }

    img.click();
    $(".loader").hide();
    Open = true;
    currentImgId = image.imageId;

}


function transformImg(action, image){

    console.log(action);
    var currentImg = document.getElementById(image.imageId);
    var currentModalImg = document.getElementById(image.modalImg);
    var parameters = { image: image.id,action:action };
    $.get( '/edit',parameters, function(data) {
        var i = $.parseHTML(data);
        var src = $(i).attr('src');
        currentImg.src = src;
        currentModalImg.src=src;
    });

}

function del(imageId){

    var r = confirm("Do you really wish to delete this image?");
    if(r){
    var parameters = { imageId: imageId };
    $.get( '/delete',parameters, function(data) {
        location.reload();
    });
    }
}
function publish(imageId){

    var currentImg = document.getElementById(imageId);
    var url = currentImg.src;
    var r = confirm("Publish this image to imgur?");
    if(r){
        var parameters = { url: url };
        $.get( '/publish',parameters, function(data) {
            console.log(data);
            var win = window.open(data,'_blank');
            win.focus();
            document.getElementById('imgLink').innerHTML = 'Link to your image: <a href='+data+'>'+data+'</a>';
        });
    }
}
//urls.indexOf(url) === -1
function addToAlbum(imageId,modalImgId, btn){
    var currentImg = document.getElementById(imageId);
    var url = currentImg.src;
    var index = AlbumList.indexOf(url)
    if(index === -1){
        AlbumList[AlbumImageCount] = url;
        AlbumImageCount += 1;
        $('#'+imageId).addClass('imgChosen');
        $('#'+modalImgId).addClass('imgChosen');
        btn.innerHTML = 'Remove from album';
    }else{
        AlbumList.splice(index,1);
        AlbumImageCount -= 1;
        $('#'+imageId).removeClass('imgChosen');
        $('#'+modalImgId).removeClass('imgChosen');
        btn.innerHTML = 'Add to album';
    }
}
function PublishAlbum() {
    console.log(AlbumList);
    if(AlbumList.length >0){
    var r = confirm("Do you wish to publish these "+AlbumList.length+" images as an album?");
    if(r){
        var parameters = { imgList: AlbumList };
        $.get( '/publishalbum',parameters, function(data) {
            if(data == 'error'){
            alert('You must be logged in to publish albums');
            }else{
                console.log(data);
                var win = window.open(data,'_blank');
                win.focus();
                document.getElementById('imgLink').innerHTML = 'Link to your album: <a href='+data+'>'+data+'</a>';
            }
        });
    }
    }
    else{
        alert('No images selected');
    }
}

function closeModal(modal){
    document.getElementById(modal).style.display='none';
    Open = false;
}
function rearrangeList(removeItem){


}

$(document).keydown(function(event) {
    if(event.which == 39 && Open == true) {

        closeModal(currentImgId.toString() + 'i');
        currentImgId += 1;
        var img = document.getElementById(currentImgId);
        if(img == null){
            Open = false;
        }else{
            img.click();
            img.click();
            Open = true;
        }
    }
    else if(event.which == 37 && Open == true){
        closeModal(currentImgId.toString() + 'i');
        currentImgId -= 1;
        var img = document.getElementById(currentImgId);
        if(img == null){
            Open = false;
        }
        else{
        img.click();
        img.click();
        Open = true;
        }
    }
});

$(document).ready(function () {
    $(document).ajaxStart(function () {
        $(".loader").show();
    }).ajaxStop(function () {
        $(".loader").hide();
    });
});

/* vue instance */
// register modal component
Vue.component('modal', {
    template: '#modal-template',
    props: {
        show: {
            type: Boolean,
            required: true,
            twoWay: true
        }
    },
    methods:{
        close:function () {
            this.show = false;
        },
        submit:function (){
            this.show = false;
            var usrnm = $('#email').val();
            var psw = $('#password').val();
            var parameters = { password: psw,email:usrnm };
            $.get( '/login',parameters, function(data) {
                alert('logged in maybe');
            });
        }
    },
    ready:function(){
        document.addEventListener("keydown", (e) => {
            if (this.show && e.keyCode == 27) {
                this.close();
            }
            else if (this.show && e.keyCode == 13) {
                this.close();
            }
        });
    }
});

// start app
new Vue({
    el: '#app',
    data: {
        showModal: false
    }
});