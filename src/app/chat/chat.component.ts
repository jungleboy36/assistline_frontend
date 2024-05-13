import { ChatService } from '../services/chat.service';
import { AuthService } from '../services/auth.service';
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { interval, switchMap } from 'rxjs';
import { PresenceService } from '../services/presence.service';
import Pusher from 'pusher-js';
import { PusherAuthService } from '../services/pusher.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: []
})
export class ChatComponent implements OnInit,AfterViewInit {
  @ViewChild('chatContainer') chatContainerRef!: ElementRef;
  conversations: any[] = [];
  conversationsUpdate: any[] = [];

  selectedConversation: any = null;
  newMessage: string = '';
  userId : string ='';
  messages : any= [];
  picture : any;
  profilePicture: string | null = null;
 messagesChannel : any;
  constructor(private chatService: ChatService, public authService : AuthService,private presenceService: PresenceService, private pusherAuthService: PusherAuthService) {
    
   }

  ngOnInit(): void {
    const pusher = new Pusher('1c26d2cd463b15a19666', {
      cluster: 'eu',
    })

    this.userId = this.authService.getUserId();
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
      console.log('pusher triggered !, conversation id : ', conversation_id);
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
        if(this.conversations.length >0){
        this.selectConversation(this.conversations[0]);}
        this.conversations.forEach(conversation => {
        
        this.LoadPicture(conversation);
          this.getUserPresence(this.getSenderId(conversation)!,conversation);
        });


      },
      (error) => {
        console.error('Error fetching conversations:', error);
      }
    );
  }

  selectConversation(conversation: any) {
    this.selectedConversation = conversation;
    this.selectedConversation.notif = false;
    this.fetchMessages(conversation.id);
  }

  fetchMessages(conversationId: string) {
    console.log("conversation id fetch messages: ",conversationId);
    this.chatService.getMessages(conversationId).subscribe(
      (messages: any[]) => {
        this.messages = messages;
        console.log("messages: ",this.messages);
      },
      (error) => {
        console.error('Error fetching messages:', error);
      }
    );
  }

  sendMessage() {
    const message = {
      id: this.selectedConversation.id,  
      message: this.newMessage,
      sender_id : this.getSenderId(this.selectedConversation)!,
      display_name : this.getDisplayName(this.selectedConversation)!,
      receiver_id : this.getSenderrId(this.selectedConversation),
      sender_display_name : this.authService.getDisplayName()
    };

    this.chatService.sendMessage(message).subscribe(
      (response) => {
        this.newMessage = '';
        this.fetchMessages(this.selectedConversation.id);
        this.scrollToBottom();
        this.triggerPusherEvent(message.sender_id);
      },
      (error) => {
        console.error('Error sending message:', error);
      }
    );
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
      scrollToBottom() {
        // After adding new content to the chat container
// Select all elements with the class "simplebar-content-wrapper"
const contentWrappers = document.querySelectorAll('.simplebar-content-wrapper');

// Check if there are at least three elements with the class
if (contentWrappers.length >= 3) {
    // Get the third element (index 2 because JavaScript arrays are zero-based)
    const thirdContentWrapper = contentWrappers[2];
    thirdContentWrapper.scrollTop = thirdContentWrapper.scrollHeight;
    // Now you can work with the third content wrapper element
    console.log(thirdContentWrapper);
} else {
    // Handle the case where there are fewer than three elements with the class
    console.log('There are fewer than three elements with the class "simplebar-content-wrapper"');
}

      }

      fetchDataEveryFiveSeconds(): void {
        interval(7000).pipe(
          switchMap(() => this.chatService.getConversations(this.userId))
        ).subscribe((conversations: any[]) => {
          this.conversationsUpdate = conversations;
          this.conversationsUpdate.forEach(conversation => {
            this.LoadPicture(conversation);
             this.getUserPresence(this.getSenderId(conversation)!,conversation);
           
          });
          this.getUserPresence(this.getSenderId(this.selectedConversation)!,this.selectedConversation);
        }, (error) => {
          console.error('Error fetching conversations:', error);
        });
    
        interval(3000).pipe(
          switchMap(() => this.chatService.getMessages(this.selectedConversation.id))
        ).subscribe((messages: any[]) => {
          this.messages = messages;
          console.log("messages: ", this.messages);
        }, (error) => {
          console.error('Error fetching messages:', error);
        });
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
      private triggerPusherEvent(recipientUserId: string) {
        const pusher = new Pusher('1c26d2cd463b15a19666', {
          cluster: 'eu',
        });
    
        const channel = pusher.subscribe('private-' + recipientUserId);
        channel.bind('new-message', () => {
          // Optionally, you can fetch conversations here if you want to update the conversation list when a new message arrives
          // this.fetchConversations();
        });
    
        // Trigger the event
        channel.trigger('new-message', {}); // Trigger event on the channel, not on the pusher object
      }



      authenticatePusher() {
        const channelName = 'new-message';
        const socketId = '180244.65591157';
        
        this.pusherAuthService.authenticatePusher(channelName, socketId)
          .subscribe(response => {
            console.log('Pusher authentication successful:', response);
            // Handle authentication success
          }, error => {
            console.error('Pusher authentication failed:', error);
            // Handle authentication failure
          });
      }
      
    }
    
  

