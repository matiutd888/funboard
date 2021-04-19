from django.conf.urls import include, url
from django.urls import path
from board.views import disp_profiles, about, canvas, BoardCreateView, BoardDetailView, UserBoardsView, BoardDeleteView, save_canvas

urlpatterns = [
    url('profile/', UserBoardsView.as_view(), name='disp_profile'),
    url('about/', about, name='about'),
    url('canvas/', canvas, name='canvas'),
    url('board/new/', BoardCreateView.as_view(), name='board-create'),
    path('board/<int:pk>/', BoardDetailView.as_view(), name='board-detail'),
    path('board/<int:pk>/delete/', BoardDeleteView.as_view(), name='board-delete'),
    url('board/update/', save_canvas, name='save_canvas'),
    url('', disp_profiles, name='disp-boards'),
]
