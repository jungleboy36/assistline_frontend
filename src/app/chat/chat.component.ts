import { ChatService } from '../services/chat.service';
import { AuthService } from '../services/auth.service';
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { interval } from 'rxjs';
import { PresenceService } from '../services/presence.service';
import Pusher from 'pusher-js';
import Swal from 'sweetalert2';
import { ProfileService } from '../services/profile.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Renderer2, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: []
})
export class ChatComponent implements OnInit,AfterViewInit {
  @ViewChild('chatContainer') chatContainerRef!: ElementRef;
  @ViewChild('cancelButton') cancelButton: ElementRef | undefined;
  @ViewChild('cancelButtonCompany') cancelButtonCompany: ElementRef | undefined;
  @ViewChild('cancelButtonClient') cancelButtonClient: ElementRef | undefined;
  @ViewChild('feedbackForm', { static: false }) feedbackForm: NgForm | undefined;
  flagged : boolean = false;
  conversations: any[] = [];
  conversationsUpdate: any[] = [];
  autoMessage : string = ''
  selectedConversation: any = null;
  newMessage: string = '';
  userId : string ='';
  messages : any= [];
  picture : any;
  profilePicture: string | null = null;
 messagesChannel : any;
 isCompanyy : boolean = false;
 paypalExist : boolean = false;
 merchantId : string = '';
 amount : number = 0 ;
 paymentDone : boolean = false;
  paymentChannel: any;
  feedback_id : string = '';
  loadingAvis : boolean = false;
  pusher = new Pusher('1c26d2cd463b15a19666', {
      cluster: 'eu',
    })
  constructor(private chatService: ChatService, public authService : AuthService,private presenceService: PresenceService, private profileService : ProfileService,private sanitizer: DomSanitizer, private renderer2: Renderer2,
    @Inject(DOCUMENT) private _document:Document) {
   }

  ngOnInit(): void {
    this.userId = this.authService.getUserId();
    (window as any).onPaymentSuccess = this.onPaymentSuccess.bind(this);
    (window as any).onCancelPayment = this.cancelPayment.bind(this);
    (window as any).openModal = this.openModal.bind(this);
    this.isCompanyy= localStorage.getItem('role') == 'company'
    const pusher = new Pusher('1c26d2cd463b15a19666', {
      cluster: 'eu',
    })

  
    this.getAutoMessage();
    this.fetchConversations();


    this.profilePicture =localStorage.getItem('profileImageUrl');
    //this.fetchDataEveryFiveSeconds();
    //this.conversations = this.conversationsUpdate;
    this.messagesChannel = pusher.subscribe(this.authService.getUserId());
    this.messagesChannel.bind('new-message', (data:any) => {
      const conversation_id = data.conversation_id;
      this.conversations.forEach(conversation =>{
      if (conversation.id == conversation_id && this.selectedConversation.id != conversation_id){
        conversation.notif = true;
      }
    
   
      })
      
      //console.log('pusher triggered !, conversation id : ', conversation_id);
      if(this.selectedConversation.id == conversation_id){
      this.fetchMessages(conversation_id);}
    });
    pusher.subscribe('users').bind('status',(data :any)=>{
      this.conversations.forEach(conversation =>{
        if(conversation.participants.includes(data.userId))
         this.getUserPresence(this.getSenderId(conversation)!,conversation);
      })
    })
  
  }

  fetchConversations() {
    this.chatService.getConversations(this.userId).subscribe(
      (conversations: any[]) => {
        this.conversations = conversations;
        this.conversations = conversations.sort((a, b) => {
          return new Date(b.time).getTime() - new Date(a.time).getTime();
        });
      
        if(this.conversations.length >0){
        this.selectConversation(this.conversations[0]);}
        this.conversations.forEach(conversation => {
        
        this.LoadPicture(conversation);
          this.getUserPresence(this.getSenderId(conversation)!,conversation);
        });
        
        this.LoadData();
        this.LoadReceiverData().then(()=>{
          this.appendFirstScript(this.merchantId).then(() => {
            console.log('First paypal script loaded successfully');
            this.appendSecondScript();
      
          });
        });
        this.getPaymentData();
        this.retrieve_feedbackk();

      },
      (error) => {
        console.error('Error fetching conversations:', error);
      }
    );
  }

  selectConversation(conversation: any) {
    this.selectedConversation = conversation;
    this.selectedConversation.notif = false;
    this.getPaymentData();
    this.retrieve_feedbackk();
    this.fetchMessages(conversation.id);
    this.paymentChannel = this.pusher.subscribe(this.selectedConversation.id);
    this.paymentChannel.bind('paiements',(data :any)=>{
      this.getPaymentData();
      this.scrollToBottom();


    });

    
  }

  fetchMessages(conversationId: string) {
    console.log("conversation id fetch messages: ",conversationId);

    this.chatService.getMessages(conversationId).subscribe(
      (messages: any[]) => {
        this.messages = messages;
        //console.log("messages: ",this.messages);
        setTimeout(() => {
          this.scrollToBottom();
        }, 500);

      }
      ,
      (error) => {
        console.error('Error fetching messages:', error);
      }
    );
  }

  sendMessage() {
    if( this.isEmpty(this.newMessage)){
    const message = {
      id: this.selectedConversation.id,  
      message: this.newMessage,
      sender_id : this.getSenderId(this.selectedConversation)!,
      display_name : this.getDisplayName(this.selectedConversation)!,
      receiver_id : this.getSenderrId(this.selectedConversation),
      sender_display_name : this.authService.getDisplayName()
    };
    this.newMessage = '';

    this.chatService.sendMessage(message).subscribe(
      (response) => {
        this.fetchMessages(this.selectedConversation.id);
        this.scrollToBottom();
      },
      (error) => {
        console.error('Error sending message:', error);
      }
    );}
  }

  getDisplayName(conversation: any) : string | null {
    const display_name = this.authService.getDisplayName();
    if (conversation.display_names[0] == display_name ){
      return conversation.display_names[1]}
    return conversation.display_names[0]

    }

    LoadPicture(conversation: any){
      const Id = this.getSenderId(conversation);
      const conversation_id = conversation.id;
      // Call your service method to load the picture
      this.chatService.getUserProfile(Id!).subscribe(
        (profile: any) => {
          this.picture = profile.image;
          localStorage.setItem('conversation_image/' + conversation_id, this.picture);
        },
        (error) => {
          console.error('Error fetching conversation picture:', error);
        }
      );
      // Return the picture URL
    }
    
    getPicture(conversation:any){
      return localStorage.getItem('conversation_image/'+conversation.id);
    }

    getSenderId(conversation : any): string | null {
      
      if (conversation.participants[0] == this.userId ){
        return conversation.participants[1]}
      return conversation.participants[0]
  
      }
      getSenderrId(conversation : any): string | null {
      
        if (conversation.participants[0] == this.userId ){
          return conversation.participants[0]}
        return conversation.participants[1]
    
        }
      isEmpty(message: string) : boolean {
        return message.trim() != '';
      }
      ngAfterViewInit() {
        // Scroll to the bottom of the chat container after the view is initialized
        this.scrollToBottom();

      }
      scrollToBottom():void {
        // After adding new content to the chat container
// Select all elements with the class "simplebar-content-wrapper"
const contentWrappers = document.querySelectorAll('.simplebar-content-wrapper');

// Check if there are at least three elements with the class
if (contentWrappers.length >= 3) {
    // Get the third element (index 2 because JavaScript arrays are zero-based)
    const thirdContentWrapper = contentWrappers[2];
    thirdContentWrapper.scrollTop = thirdContentWrapper.scrollHeight;
    return;
    // Now you can work with the third content wrapper element
    //console.log(thirdContentWrapper);
} else {
    // Handle the case where there are fewer than three elements with the class
    //console.log('There are fewer than three elements with the class "simplebar-content-wrapper"');
}

      }

      getUserPresence(userId : string,conversation: any): void {
        this.presenceService.getUserPresence(userId).subscribe(
          (response) => {
            console.log("user id presence :",userId);
            console.log("online: ",response.online);
            conversation.online =  response.online;
          },
          (error) => {
            console.error('Error fetching user presence:', error);
            
          }
        );
      }

      isOnline(conversation : any) : boolean {
        if(conversation && 'online' in conversation)
        {
          return conversation.online;
        }
        return false;
      }

      new(conversation : any) : boolean {
        if(conversation && 'notif' in conversation)
        {
          return conversation.notif;
      }
      return false;}
    
saveAutoMessage(){
  this.chatService.saveAutoMessage(this.authService.getUserId(),this.autoMessage).subscribe(
    (response) => {
      this.clickCancelButton()
console.log("auto message saved");
Swal.fire({
  icon: 'success',
  title: 'Message automatique sauvegardé !',
  showConfirmButton: false,
  timer: 800,
});
    },
    (error) => {
      console.error('Error adding auto message:', error);
    }
  );


}


clickCancelButton() {
  if (this.cancelButton) {
    this.cancelButton.nativeElement.click();
  }
  if(this.cancelButtonClient){
    this.cancelButtonClient.nativeElement.click();
  }
  if(this.cancelButtonCompany){
    this.cancelButtonCompany.nativeElement.click();
  }
}


getAutoMessage(){
  this.profileService.getUserProfile(this.userId).subscribe(data =>
    {
      this.autoMessage = data.autoMessage;
      console.log(this.autoMessage);
    })
}

LoadData(){
    this.profileService.getUserProfile(this.userId).subscribe(data =>
      {
        //console.log('data from chat component: ',data);

        //console.log('role from chat component: ',data.role);
        
        this.paypalExist = !!data.paypalEmail;
        console.log('paypal email data: ',this.paypalExist);
      })
  
}

LoadReceiverData():Promise<void>{
  return new Promise<void>((resolve, reject) => {
    console.log('load receiver data :', this.selectedConversation);
  this.profileService.getUserProfile(this.getSenderId(this.selectedConversation)!).subscribe(data =>
    {
      //console.log('data from chat component: ',data);

    console.log('MERCHANT ID: ',data.paypalEmail);
    this.merchantId = data.paypalEmail;
    resolve();
    })
  });
}
appendFirstScript(merchantId : string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    // Create the first script element
    const s = this.renderer2.createElement('script');
    s.type = 'text/javascript';
    s.src = 'https://www.paypal.com/sdk/js?merchant-id='+merchantId+'&client-id=ASNm3WXakzlzfdZ5M7oTK6ggcGhL_fEYYT75QB7CXnHfdkF2ns7UHSnnZhWfBGKhNkU_Ty6gSEfw1EM_&currency=EUR';
    s.async = true;

    // Set up a callback for when the first script is loaded
    s.onload = () => {
      resolve();
    };

    // Append the first script element to the document head
    this.renderer2.appendChild(this._document.head, s);
  });
}

appendSecondScript() {
  // Create the second script element
  const paypalButtonContainer = this._document.getElementById('paypal-button-container');
  if (paypalButtonContainer) {
    paypalButtonContainer.innerHTML = '';
  }
  const ss = this.renderer2.createElement('script');
  ss.id = 'paypal-script';
  ss.text = `
  paypal.Buttons({
    createOrder: function(data, actions) {
      return actions.order.create({
        purchase_units: [{
          amount: {
            value: '${this.amount}',
            currency_code: 'EUR'
          },
          payee: {
            email_address: 'achrafhafsia36-facilitator@gmail.com'} // Specify the email address of the recipient
            // Optionally, you can also specify other details such as merchant ID, etc.
          
        }]
      });
    },
    onApprove: function(data, actions) {
      return actions.order.capture().then(function(details) {
        // Handle successful payment
        console.log('Payment successful!');
        window.onPaymentSuccess();
        window.openModal();
      });
    },
    onCancel: function(data) {
      // Handle payment cancellation
      console.log('Payment cancelled by the user.');
       window.onCancelPayment();
    },
    onError: function(err) {
      // Handle other errors
      console.error('An error occurred:', err);
      // Display error message to the user or take appropriate action
    }
  }).render('#paypal-button-container');
  
  `;
  
  // Append the second script element to the document head
  this.renderer2.appendChild(this._document.head, ss);
}

removePayPalScript() {
  const script = this._document.getElementById('paypal-script');
  if (script) {
    this.renderer2.removeChild(this._document.head, script);
  }
}

newPayment(){
  
  const payment = {
    amount : this.amount,
    sender_id : this.getSenderId(this.selectedConversation),
    receiver_id : this.userId,
    conversation_id : this.selectedConversation.id

  }
  console.log('payment data: ',payment);
  this.chatService.createPayment(payment).subscribe((data)=>{
    this.conversations.forEach(convo =>{
      if(convo.id == this.selectedConversation.id){
        convo.payment_id = data.payment_id;
        this.selectedConversation.payment_id = data.payment_id;
       }
    })
    this.clickCancelButton();
    Swal.fire({
      icon: 'success',
      title: 'Payment sauvegardé !',
      showConfirmButton: false,
      timer: 800,
    });
   
  })
}

getPaymentData():any{
  if(!!this.selectedConversation.payment_id && this.selectedConversation.payment_id != null){
  this.chatService.retrievePayment(this.selectedConversation.payment_id).subscribe((data)=>{
  this.amount = data.amount;
  this.paymentDone = data.paid ;
  this.loadingAvis = true;
  this.removePayPalScript();
  this.appendSecondScript();
  console.log("payment data: ",data);
  })
}
else{
  
  this.paymentDone = false;
}
}



cancelPayment(){
  
  this.clickCancelButton();

    Swal.fire({
      icon: 'success',
      title: 'Payment annulé !',
      showConfirmButton: false,
      timer: 800,
    });
  

}

cancelPaymentCompany(){
  
  this.chatService.deletePayment(this.selectedConversation.payment_id,this.selectedConversation.id).subscribe(()=>{
    this.clickCancelButton();
     delete this.selectedConversation.payment_id ;
    this.amount=0;
    Swal.fire({
      icon: 'success',
      title: 'Payment annulé !',
      showConfirmButton: false,
      timer: 800,
    });
  })

}
onPaymentSuccess() {
  // Triggered when payment is successful

  this.chatService.updatePayment(this.selectedConversation.payment_id,this.selectedConversation.id).subscribe(()=>{
    this.clickCancelButton()
    Swal.fire({ title: 'Paiement réussi ! Veuillez vérifier votre e-mail pour les informations de transaction.', icon: 'success' }); 
  })
  // Afficher le message de succès
}

openModal(): void {
  ($('#feedbackModal') as any).modal('show');
}

resetModal(): void {
  if (this.feedbackForm) {
    ($('#feedbackModal') as any).modal('hide');
  }
}

saveFeedback(feedbackForm: NgForm): void {
  const star = feedbackForm.value.star;
  const comment = feedbackForm.value.comment;
  console.log('Star Rating:', star);
  console.log('Comment:', comment);
  console.log("saved flag: ",this.flagged);
  if(this.selectedConversation.feedback_id){
    this.feedback_id = this.selectedConversation.feedback_id;
  }
  else{
    this.feedback_id = 'none';
  }
  const data = {
    feedback_id :this.feedback_id,
    star,
    comment,
    flagged : this.flagged,
    client_id: this.authService.getUserId(),
    company_id: this.getSenderId(this.selectedConversation),
  };

  this.chatService.save_feedback(data).subscribe(()=>{
    Swal.fire({ title: 'avis enregistré !', icon: 'success'});
    this.retrieve_feedbackk();

  });
  // Add your logic to handle the form submission, such as making an HTTP request to save the feedback

  // Close the modal after saving the feedback
  ($('#feedbackModal') as any).modal('hide');
  
  this.retrieve_feedbackk();
}

retrieve_feedbackk(){
  this.chatService.retrieve_feedback(this.authService.getUserId(),this.getSenderId(this.selectedConversation)!).subscribe((data)=>{
    console.log('feedback data: ',data[0]);
    if (data && data.length > 0) {
      console.log('feedback data: ', data[0]);
      const feedbackComment = document.querySelector('textarea[name="comment"]') as HTMLInputElement;
      feedbackComment.value = data[0].comment;
      this.feedback_id = data[0].id;
      this.selectedConversation.feedback_id = data[0].id;
      this.flagged = data[0].flagged;

      const starRadio = document.querySelector(`input[name="star"][value="${data[0].star}"]`) as HTMLInputElement;
      if (starRadio) {
        starRadio.checked = true;
      }

      this.feedbackForm?.controls['star'].setValue(data[0].star);
      this.feedbackForm?.controls['star'].updateValueAndValidity();
      this.feedbackForm?.controls['comment'].setValue(data[0].comment);
      this.feedbackForm?.controls['comment'].updateValueAndValidity();
    } else {
      // Handle case when data is empty
      console.log('No feedback data retrieved.');
      this.feedbackForm?.reset();
      // You may want to clear form fields or handle this case accordingly
    }
  })
}
    }
    
  

