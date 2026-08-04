import { Component, OnInit, AfterViewChecked, ViewChild, ElementRef, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';

interface Turno {
  tipo: 'usuario' | 'mentor' | 'sistema';
  texto: string;
}

@Component({
  selector: 'norte-chat',
  standalone: true,
  imports: [SidebarComponent, FormsModule],
  templateUrl: './chat.component.html',
})
export class ChatComponent implements OnInit, AfterViewChecked {
  private chatService = inject(ChatService);
  private auth = inject(AuthService);

  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLDivElement>;

  carregando = signal(true);
  enviando = signal(false);
  turnos = signal<Turno[]>([]);
  mensagemAtual = '';

  private precisaRolar = false;

  ngOnInit() {
    this.chatService.buscarHistorico().subscribe({
      next: (historico) => {
        const turnos: Turno[] = historico.flatMap((h) => [
          { tipo: 'usuario' as const, texto: h.mensagem },
          { tipo: 'mentor' as const, texto: h.resposta },
        ]);
        this.turnos.set(turnos);
        this.carregando.set(false);
        this.precisaRolar = true;
      },
      error: () => {
        this.carregando.set(false);
      },
    });
  }

  ngAfterViewChecked() {
    if (this.precisaRolar && this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      this.precisaRolar = false;
    }
  }

  get nomeUsuario() {
    return this.auth.usuarioAtual()?.nome?.split(' ')[0] ?? '';
  }

  enviar() {
    const texto = this.mensagemAtual.trim();
    if (!texto || this.enviando()) return;

    this.turnos.update((lista) => [...lista, { tipo: 'usuario', texto }]);
    this.mensagemAtual = '';
    this.enviando.set(true);
    this.precisaRolar = true;

    this.chatService.enviarMensagem(texto).subscribe({
      next: (res) => {
        this.turnos.update((lista) => [...lista, { tipo: 'mentor', texto: res.message }]);
        this.enviando.set(false);
        this.precisaRolar = true;
      },
      error: (err) => {
        const codigo = err?.error?.code;
        let mensagemErro = 'Não consegui responder agora. Tenta de novo em instantes?';

        if (codigo === 'IA_NAO_CONFIGURADA') {
          mensagemErro = 'O mentor IA ainda não está configurado neste ambiente. Peça pro administrador configurar a GEMINI_API_KEY.';
        } else if (codigo === 'CONSENTIMENTO_NECESSARIO') {
          mensagemErro = 'Pra usar o mentor IA, você precisa aceitar a Política de Privacidade e os Termos de Uso primeiro.';
        } else if (codigo === 'LIMITE_PLANO_FREE') {
          mensagemErro = err?.error?.error ?? 'Você atingiu o limite diário do plano Free. Assine o Premium em Perfil > Assinatura pra uso ilimitado.';
        }

        this.turnos.update((lista) => [...lista, { tipo: 'sistema', texto: mensagemErro }]);
        this.enviando.set(false);
        this.precisaRolar = true;
      },
    });
  }
}
