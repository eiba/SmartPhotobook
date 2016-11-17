var currentImgId = null;    //current clicked image
var Open = false;           //is a picture modal box open?
var AlbumList = [];         //List of albums to be published
var AlbumImageCount = 0;    //AlbumImages in the list

//This method sets the handelers for when an image is clicked.
function setHandlers(image){
    //The parameters that are sent in
    var img = document.getElementById(image.imageId);
    var modalImg = document.getElementById(image.modalImg);
    var modal = document.getElementById(image.modalId);
    var caption = document.getElementById(image.captionId);

    //current sent in image is clicked and we set the image to be displayed in the modal box
    img.onclick = function(){
        modal.style.display = "block";
        modalImg.src = this.src;
        currentImgId = image.imageId;
        Open = true;
    };
    //also initializing the value slider
    $('#'+image.sliderId).slider({
        formatter: function(value) {
            return value;
        }
    });
    //when the caption field or the image inside the modal container is clicked, prevent the modal box from closing
    caption.onclick =function(e) {
        e.stopPropagation();
    };
    modalImg.onclick =function(e) {
        e.stopPropagation();
    };

    img.click();    //click on image after handelers are set to actually display the image
    $(".loader").hide();    //hide the ajax loader
    Open = true;            //an image is now open
    currentImgId = image.imageId;      //and this is the current image

}

//Transform method for adding effects via the cloudinary api
function transformImg(action, image){

    var currentImg = document.getElementById(image.imageId);    //image to transform
    var currentModalImg = document.getElementById(image.modalImg);  //modal image to transform
    var parameters = { image: image.id,action:action };             //parameters to send to server (image id and the action(effect) to use on image)
    $.get( '/edit',parameters, function(data) {                     //gets the edit method on the server via an ajax call
        var i = $.parseHTML(data);             //parse returned data as html object
        var src = $(i).attr('src');            //get the source url of the html image object
        currentImg.src = src;                   //change the source url of the current image and modal image
        currentModalImg.src=src;
    });

}

//delete method for removing images from the cloud
function del(imageId){
    var r = confirm("Do you really wish to delete this image?");
    if(r){                                                          //if yes proceed
    var parameters = { imageId: imageId };                          //parameters to server
    $.get( '/delete',parameters, function(data) {                   //upon return from server reload view
        location.reload();
    });
    }
}

//publish method for publishing a single image to imgur
function publish(imageId){

    //get the current image and url and ask if the user really wanna publish
    var currentImg = document.getElementById(imageId);
    var url = currentImg.src;
    var r = confirm("Publish this image to imgur?");
    if(r){
        var parameters = { url: url };
        $.get( '/publish',parameters, function(data) {      //upon return add the imgur url to the page for displaying and open a new tab to show the picture
            if(data == 'error'){                            //error is returned
                alert('An error ocurred when uploading the image');
            }else{                                          //works fine
                document.getElementById('imgLink').innerHTML = 'Link to your image: <a href='+data+'>'+data+'</a>';
                var win = window.open(data,'_blank');
                win.focus();
            }
        });
    }
}

//function for adding images to album
function addToAlbum(imageId,modalImgId, btn){
    var currentImg = document.getElementById(imageId);      //current image
    var url = currentImg.src;
    var index = AlbumList.indexOf(url); //find the position of this image in the array used for publishing
    if(index === -1){                       //the image is not in the array, so add it to the array, apply html effects and and increase the image count
        AlbumList[AlbumImageCount] = url;
        AlbumImageCount += 1;
        $('#'+imageId).addClass('imgChosen');
        $('#'+modalImgId).addClass('imgChosen');
        btn.innerHTML = 'Remove from album';
        }else{                              //the image is already in the array, which means we want to remove it, so remove it from array, decrease image count and remove effects.
        AlbumList.splice(index,1);
        AlbumImageCount -= 1;
        $('#'+imageId).removeClass('imgChosen');
        $('#'+modalImgId).removeClass('imgChosen');
        btn.innerHTML = 'Add to album';
    }
}
//publishes the images in the album array
function PublishAlbum() {
    if(AlbumList.length >0){
    var r = confirm("Do you wish to publish these "+AlbumList.length+" images as an album?"); //if length is above 0 prompt if they really wanna publish
    if(r){
        var parameters = { imgList: AlbumList };
        $.get( '/publishalbum',parameters, function(data) { //publish albums from the server
            if(data == 'error'){                            //the returned data says error
            alert('You must be logged in to publish albums');   //which means you must log in to publish albums
            }else{
                document.getElementById('imgLink').innerHTML = 'Link to your album: <a href='+data+'>'+data+'</a>';     //add link to page
                var win = window.open(data,'_blank');                                                                   //open url in new tab
                win.focus();
            }
        });
    }
    }
    else{
        alert('No images selected');    //no images in array
    }
}

//closes the modal and sets the variable open to false
function closeModal(modal){
    document.getElementById(modal).style.display='none';
    Open = false;
}

// keydown method that shows pictures based on arrow keys
$(document).keydown(function(event) {
    if(event.which == 39 && Open == true) { //right arrow is pressed and there is an image open

        closeModal(currentImgId.toString() + 'i');  //closes currently open modal
        currentImgId += 1;
        var img = document.getElementById(currentImgId);
        if(img == null){    //if the next image is null, just open is false, no image to display
            Open = false;
        }else{              //else it is open
            img.click();
            img.click();    //has to click two times in case handeler in not already set
            Open = true;    //a modal image is open
        }
    }
    else if(event.which == 37 && Open == true){ //the left arrow is pressed and an image is open, do same as above just decrease and show previous image
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

//show the ajax loader icon if there is currently an ajax request going on
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
        close:function () {         //function to close vue modal
            this.show = false;
        },
        submit:function (){         //upon submitting, submit to server and close modal
            this.show = false;
            var usrnm = $('#email').val();
            var psw = $('#password').val();
            var parameters = { password: psw,email:usrnm };
            $.get( '/login',parameters, function(data) {
            });
        }
    },
    ready:function(){
        document.addEventListener("keydown", (e) => {
            if (this.show && e.keyCode == 27) {         //close vue modal box if it is esc key is clicked and it is open
                this.close();
            }
            else if (this.show && e.keyCode == 13) {    //submit username / password to server if it is showing and enter is clicked
                this.submit();
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